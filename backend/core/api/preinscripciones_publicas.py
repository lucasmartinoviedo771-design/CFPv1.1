from datetime import date, timedelta
import json
from typing import List, Optional
import unicodedata

from django.db import transaction
from ninja import Router, Schema
from ninja.errors import HttpError

import os
import threading
from django.core.mail import EmailMessage
from django.conf import settings
from core.models import Cohorte, Estudiante, Inscripcion, Examen, Bloque, Modulo
from core.serializers import EstudianteSerializer
from core.utils.estudiante_normalization import normalize_dni_digits

router = Router(tags=["preinscripciones-publicas"])


class OfertaBloqueOut(Schema):
    bloque_id: int
    bloque_nombre: str
    cohorte_id: int
    cohorte_nombre: str
    correlativas_ids: List[int]


class OfertaProgramaOut(Schema):
    programa_id: int
    programa_nombre: str
    requiere_titulo_secundario: bool
    bloques: List[OfertaBloqueOut]


class PreinscripcionOfertaOut(Schema):
    items: List[OfertaProgramaOut]


class PreinscripcionIn(Schema):
    email: str
    apellido: str
    nombre: str
    dni: str
    cuit: Optional[str] = None
    sexo: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    pais_nacimiento: Optional[str] = None
    pais_nacimiento_otro: Optional[str] = None
    nacionalidad: Optional[str] = None
    nacionalidad_otra: Optional[str] = None
    lugar_nacimiento: Optional[str] = None
    domicilio: Optional[str] = None
    barrio: Optional[str] = None
    ciudad: Optional[str] = None
    telefono: Optional[str] = None
    nivel_educativo: Optional[str] = None
    posee_pc: Optional[bool] = False
    posee_conectividad: Optional[bool] = False
    puede_traer_pc: Optional[bool] = False
    trabaja: Optional[bool] = False
    lugar_trabajo: Optional[str] = None
    programa_id: int
    bloque_ids: Optional[List[int]] = None
    dni_digitalizado: str
    titulo_secundario_digitalizado: Optional[str] = None
    tutor_nombre: Optional[str] = None
    tutor_dni: Optional[str] = None
    dni_tutor_digitalizado: Optional[str] = None


class PreinscripcionOut(Schema):
    ok: bool
    estudiante_id: int
    estatus: str
    inscripciones_creadas: List[int]
    inscripciones_existentes: List[int]
    mensaje: str


MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}


def _normalize_text(value: str) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return text.strip().lower()


def _programa_requiere_titulo(programa) -> bool:
    return bool(programa.requiere_titulo_secundario) or _normalize_text(programa.nombre) == "programador de nivel iii"


def _bloques_aprobados_ids(estudiante_id: int) -> set[int]:
    return set(
        Bloque.objects.filter(
            examenes__notas__estudiante_id=estudiante_id,
            examenes__notas__aprobado=True,
            examenes__tipo_examen__in=[Examen.FINAL_SINC, Examen.FINAL_VIRTUAL, Examen.EQUIVALENCIA],
        )
        .distinct()
        .values_list("id", flat=True)
    )


def _esta_en_periodo_examenes(cohorte: Cohorte, hoy: date) -> bool:
    if not cohorte.fecha_fin:
        return False
    return hoy >= (cohorte.fecha_fin - timedelta(days=14))


def _cohortes_habilitadas() -> List[Cohorte]:
    hoy = date.today()
    base_qs = (
        Cohorte.objects.select_related("programa", "bloque")
        .prefetch_related("bloque__correlativas", "bloque__modulos")
        .filter(programa__activo=True, bloque__isnull=False)
    )
    agrupadas: dict[tuple[int, int], List[Cohorte]] = {}
    for cohorte in base_qs:
        key = (cohorte.programa_id, cohorte.bloque_id)
        agrupadas.setdefault(key, []).append(cohorte)

    habilitadas: List[Cohorte] = []
    for _, cohortes in agrupadas.items():
        cohortes_sorted = sorted(cohortes, key=lambda c: ((c.fecha_inicio or date.min), c.id))
        actuales = [
            c for c in cohortes_sorted
            if c.fecha_inicio and c.fecha_inicio <= hoy and (not c.fecha_fin or hoy <= c.fecha_fin)
        ]
        actual = actuales[-1] if actuales else None
        futuras = [c for c in cohortes_sorted if c.fecha_inicio and c.fecha_inicio > hoy]
        siguiente = futuras[0] if futuras else None

        if actual and not _esta_en_periodo_examenes(actual, hoy):
            habilitadas.append(actual)
        elif siguiente:
            habilitadas.append(siguiente)
        elif actual:
            habilitadas.append(actual)
    return habilitadas


def _as_bool(value, default=False):
    if value is None:
        return default
    text = str(value).strip().lower()
    return text in {"1", "true", "on", "yes", "si", "sí"}


def _as_optional_date(value):
    if not value:
        return None
    try:
        return date.fromisoformat(str(value))
    except ValueError:
        raise HttpError(400, "Formato de fecha inválido. Use YYYY-MM-DD.")


def _parse_bloque_ids(request) -> List[int]:
    raw = request.POST.getlist("bloque_ids")
    if not raw:
        csv = request.POST.get("bloque_ids", "")
        if csv:
            raw = [x.strip() for x in csv.split(",") if x.strip()]
    bloque_ids = []
    for value in raw:
        try:
            bloque_ids.append(int(value))
        except ValueError:
            raise HttpError(400, "bloque_ids contiene valores inválidos.")
    return bloque_ids


def _parse_seleccion_programas(request) -> List[dict]:
    raw_json = request.POST.get("seleccion_programas_json", "").strip()
    if raw_json:
        try:
            parsed = json.loads(raw_json)
        except json.JSONDecodeError:
            raise HttpError(400, "Formato inválido en seleccion_programas_json.")
        if not isinstance(parsed, list):
            raise HttpError(400, "seleccion_programas_json debe ser una lista.")
        normalizada = []
        for item in parsed:
            if not isinstance(item, dict):
                raise HttpError(400, "Cada selección de programa debe ser un objeto.")
            try:
                programa_id = int(item.get("programa_id", 0))
            except (TypeError, ValueError):
                raise HttpError(400, "programa_id inválido en selección.")
            bloque_ids = item.get("bloque_ids", [])
            if not isinstance(bloque_ids, list):
                raise HttpError(400, "bloque_ids debe ser una lista.")
            try:
                bloque_ids = [int(b) for b in bloque_ids]
            except (TypeError, ValueError):
                raise HttpError(400, "bloque_ids contiene valores inválidos.")
            normalizada.append({"programa_id": programa_id, "bloque_ids": bloque_ids})
        return normalizada

    # Backward compatible mode: una sola oferta
    try:
        programa_id = int(request.POST.get("programa_id", "0"))
    except ValueError:
        raise HttpError(400, "programa_id inválido.")
    if not programa_id:
        raise HttpError(400, "Debe seleccionar al menos una oferta formativa.")
    return [{"programa_id": programa_id, "bloque_ids": _parse_bloque_ids(request)}]


def _validar_archivo_documento(file_obj, field_label: str):
    if not file_obj:
        return
    if file_obj.size > MAX_FILE_SIZE_BYTES:
        raise HttpError(400, f"{field_label}: tamaño máximo permitido 3MB.")

    name = (file_obj.name or "").lower()
    ext = "." + name.split(".")[-1] if "." in name else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HttpError(400, f"{field_label}: formato no permitido. Use PDF o imagen.")

    content_type = (getattr(file_obj, "content_type", "") or "").lower()
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise HttpError(400, f"{field_label}: tipo de archivo no permitido.")


def _validar_correlativas(estudiante_id: int, cohortes: List[Cohorte]):
    bloques_aprobados = _bloques_aprobados_ids(estudiante_id)
    for cohorte in cohortes:
        faltantes = [b.id for b in cohorte.bloque.correlativas.all() if b.id not in bloques_aprobados]
        if faltantes:
            raise HttpError(
                400,
                (
                    f"No cumple correlativas para '{cohorte.bloque.nombre}'. "
                    f"Bloques requeridos: {', '.join(str(x) for x in faltantes)}."
                ),
            )


@router.get("/oferta", response=PreinscripcionOfertaOut, auth=None)
def listar_oferta_preinscripcion(request, programa_id: Optional[int] = None):
    qs = _cohortes_habilitadas()
    # Filtro temporal para excluir 'Sistemas de Representación'
    qs = [c for c in qs if _normalize_text(c.programa.nombre) != "sistemas de representacion"]
    if programa_id:
        qs = [c for c in qs if c.programa_id == programa_id]
    items_map: dict[int, dict] = {}
    for c in qs:
        if c.programa_id not in items_map:
            items_map[c.programa_id] = {
                "programa_id": c.programa_id,
                "programa_nombre": c.programa.nombre,
                "requiere_titulo_secundario": _programa_requiere_titulo(c.programa),
                "bloques": [],
            }
        items_map[c.programa_id]["bloques"].append(
            {
                "bloque_id": c.bloque_id,
                "bloque_nombre": c.bloque.nombre,
                "cohorte_id": c.id,
                "cohorte_nombre": c.nombre,
                "correlativas_ids": list(c.bloque.correlativas.values_list("id", flat=True)),
            }
        )
    items = [
        OfertaProgramaOut(
            programa_id=v["programa_id"],
            programa_nombre=v["programa_nombre"],
            requiere_titulo_secundario=v["requiere_titulo_secundario"],
            bloques=[OfertaBloqueOut(**b) for b in v["bloques"]],
        )
        for v in items_map.values()
    ]
    return PreinscripcionOfertaOut(items=items)


def _enviar_confirmacion_preinscripcion(estudiante: Estudiante, cohortes: List[Cohorte]):
    """
    Envía un email de confirmación con archivos adjuntos basados en los trayectos seleccionados.
    """
    try:
        hoy = date.today()
        nac = estudiante.fecha_nacimiento
        edad = hoy.year - nac.year - ((hoy.month, hoy.day) < (nac.month, nac.day)) if nac else 18
        es_menor = edad < 18
        
        subject = "Confirmación de Preinscripción - CFP Malvinas Argentinas"
        if es_menor:
            subject = "ACCION REQUERIDA: Preinscripción de Menor - CFP Malvinas Argentinas"
        
        trayectos_html = "".join([f"<li><strong>{c.programa.nombre}</strong> ({c.bloque.nombre})</li>" for c in cohortes])

        info_pdf_html = ""
        if es_menor:
            info_pdf_html = f"""
            <div class="info-pdf" style="background-color: #fff7ed; border: 1px solid #ffedd5;">
                <h3 style="color: #c2410c;">⚠️ ACCIÓN REQUERIDA PARA MENORES</h3>
                <p style="margin-top: 0;">Al ser menor de edad, para completar tu inscripción es **obligatorio** que tu padre, madre o tutor responsable:</p>
                <ul>
                    <li>1. Descargue y lea las <strong>Condiciones CODE3</strong> y las <strong>Normas de Convivencia</strong> adjuntas.</li>
                    <li>2. Imprima, complete y firme la autorizacion que figura al final del documento de condiciones.</li>
                    <li>3. Envíe una foto o escaneo de la nota firmada a: <a href="mailto:estudiantes.cfp@malvinastdf.edu.ar">estudiantes.cfp@malvinastdf.edu.ar</a></li>
                </ul>
            </div>
            """
        else:
            info_pdf_html = """
            <div class="info-pdf">
                <h3>📄 ¡No olvides revisar el PDF adjunto!</h3>
                <p style="margin-top: 0;">En este correo te hemos adjuntado un documento muy importante con toda la información que necesitas sobre tu cursada. Allí encontrarás:</p>
                <ul>
                    <li><strong>🗓️ Horarios de los encuentros sincrónicos:</strong> Para que puedas organizarte y no perderte ninguna clase.</li>
                    <li><strong>📅 Cronograma de evaluaciones:</strong> Fechas exactas de parciales, finales virtuales y finales sincrónicos.</li>
                    <li><strong>📋 Requisitos y Correlatividades:</strong> Las condiciones necesarias para poder cursar y aprobar los módulos.</li>
                    <li><strong>📌 Condiciones de Cursado:</strong> Información detallada sobre el funcionamiento del campus virtual y los periodos de receso.</li>
                </ul>
            </div>
            """
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f5; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; overflow: hidden; }}
                .header {{ background-color: #0b1c3c; color: #ffffff; padding: 25px 20px; text-align: center; border-bottom: 5px solid #f26b21; }}
                .header h1 {{ margin: 0; font-size: 24px; letter-spacing: 0.5px; }}
                .header h2 {{ margin: 5px 0 0 0; font-size: 16px; font-weight: normal; color: #cbd5e1; }}
                .content {{ padding: 30px 25px; }}
                .trayectos {{ background-color: #f8fafc; padding: 15px 20px; border-left: 4px solid #f26b21; margin: 25px 0; border-radius: 0 8px 8px 0; }}
                .trayectos ul {{ margin: 0; padding-left: 20px; }}
                .trayectos li {{ margin-bottom: 5px; font-size: 15px; color: #0f172a; }}
                .info-pdf {{ background-color: #e0f2fe; padding: 20px 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #bae6fd; }}
                .info-pdf h3 {{ margin-top: 0; color: #0284c7; font-size: 18px; margin-bottom: 15px; }}
                .info-pdf ul {{ padding-left: 20px; margin-bottom: 0; }}
                .info-pdf li {{ margin-bottom: 10px; font-size: 14.5px; color: #0c4a6e; }}
                .contacto-box {{ background-color: #f1f5f9; padding: 25px; border-radius: 8px; font-size: 15px; margin-top: 20px; border: 1px solid #e2e8f0; }}
                .contacto-item {{ margin-bottom: 12px; line-height: 1.5; }}
                .contacto-item:last-child {{ margin-bottom: 0; }}
                .footer {{ background-color: #0f172a; color: #94a3b8; text-align: center; padding: 20px; font-size: 12px; }}
                a {{ color: #0284c7; text-decoration: none; font-weight: 600; }}
                a:hover {{ text-decoration: underline; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Centro Politécnico Superior</h1>
                    <h2>Formación Profesional - Malvinas Argentinas</h2>
                </div>
                <div class="content">
                    <p style="font-size: 17px; margin-top: 0;">Hola <strong>{estudiante.nombre}</strong>,</p>
                    <p>¡Gracias por elegirnos! Hemos recibido correctamente tu preinscripción para los siguientes trayectos de capacitación:</p>
                    
                    <div class="trayectos">
                        <ul>{trayectos_html}</ul>
                    </div>

                    {info_pdf_html}

                    <p style="font-size: 16px; margin-top: 35px;"><strong>Ante cualquier duda o consulta, recuerda mantenerte comunicado. Aquí tienes todos nuestros canales de contacto oficiales:</strong></p>
                    
                    <div class="contacto-box">
                        <div class="contacto-item">📍 <strong>Dirección:</strong> Monte Independencia 261, Barrio El Mirador (Margen Sur), Río Grande, Tierra del Fuego.</div>
                        <div class="contacto-item">📱 <strong>WhatsApp:</strong> <a href="https://wa.me/5492964355801">+54 9 2964 35-5801</a></div>
                        <div class="contacto-item">📞 <strong>Teléfono:</strong> 02964 69-7979</div>
                        <div class="contacto-item">✉️ <strong>Email:</strong> <a href="mailto:estudiantes.cfp@malvinastdf.edu.ar">estudiantes.cfp@malvinastdf.edu.ar</a></div>
                        <div class="contacto-item">🌐 <strong>Web:</strong> <a href="https://politecnico.ar">politecnico.ar</a></div>
                    </div>
                    
                    <p style="margin-top: 35px; text-align: center; font-size: 18px; color: #f26b21;"><strong>¡Te deseamos muchos éxitos en esta nueva etapa!</strong></p>
                </div>
                <div class="footer">
                    Este es un mensaje automático del sistema de gestión del CFP.<br>Por favor, no respondas a este correo.
                </div>
            </div>
        </body>
        </html>
        """
        
        email = EmailMessage(
            subject=subject,
            body=html_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[estudiante.email],
        )
        email.content_subtype = "html"

        resources_dir = os.path.join(settings.BASE_DIR, "core", "resources", "emails")
        
        # Lógica de adjuntos
        
        # Check what the student enrolled in
        def es_nIII(p_name):
            norm = _normalize_text(p_name)
            return any(n in norm for n in ["programador de nivel iii", "programacion de nivel iii"])

        tiene_nivel_III = any(es_nIII(c.programa.nombre) for c in cohortes)
        tiene_otros = any(not es_nIII(c.programa.nombre) for c in cohortes)

        pdf_paths = []
        if es_menor:
            # Archivos específicos para menores
            pdf_paths.append(os.path.join(resources_dir, "Condiciones CODE3.pdf"))
            pdf_paths.append(os.path.join(resources_dir, "Normas de Convivencia Digital.pdf"))
        else:
            if tiene_nivel_III:
                pdf_paths.append(os.path.join(resources_dir, "CODE III 2026.pdf"))
            if tiene_otros:
                pdf_paths.append(os.path.join(resources_dir, "Capacitaciones laborales 2026.pdf"))

        for pdf_path in pdf_paths:
            if os.path.exists(pdf_path):
                email.attach_file(pdf_path)

        email.send(fail_silently=True)
    except Exception as e:
        print(f"Error enviando email de confirmación: {e}")


@router.post("", response=PreinscripcionOut, auth=None)
def crear_preinscripcion_publica(request):
    # ... (código existente hasta el final del try/transaction)
    # [Mantengo la lógica existente hasta la línea 400 aprox]
    post = request.POST
    files = request.FILES

    dni = normalize_dni_digits(post.get("dni", ""))
    if len(dni) != 8:
        raise HttpError(400, "El DNI debe tener 8 dígitos.")

    fecha_nac = _as_optional_date(post.get("fecha_nacimiento"))
    if not fecha_nac:
        raise HttpError(400, "Debe ingresar fecha de nacimiento.")
    
    hoy = date.today()
    edad = hoy.year - fecha_nac.year - ((hoy.month, hoy.day) < (fecha_nac.month, fecha_nac.day))
    es_menor = edad < 18

    seleccion_programas = _parse_seleccion_programas(request)
    if not seleccion_programas:
        raise HttpError(400, "Debe seleccionar al menos una oferta formativa.")

    # Validar que si es menor solo se anote a Nivel III
    if es_menor:
        if edad < 16:
            raise HttpError(400, "La edad mínima para participar es de 16 años.")
        
        programas_ids = [s["programa_id"] for s in seleccion_programas]
        from core.models import Programa
        for pid in programas_ids:
            p = Programa.objects.get(id=pid)
            norm_name = _normalize_text(p.nombre)
            is_nIII = any(n in norm_name for n in ["programador de nivel iii", "programacion de nivel iii"])
            if not is_nIII:
                raise HttpError(400, f"Los menores de 18 años solo pueden inscribirse en el trayecto de Programación Nivel III. '{p.nombre}' no está permitido para menores.")

    dni_file = files.get("dni_digitalizado")
    titulo_file = files.get("titulo_secundario_digitalizado")
    dni_tutor_file = files.get("dni_tutor_digitalizado")
    
    if not dni_file:
        raise HttpError(400, "Debe adjuntar archivo de DNI.")
    _validar_archivo_documento(dni_file, "DNI")
    
    if es_menor:
        if not dni_tutor_file:
            raise HttpError(400, "Al ser menor de edad, debe adjuntar el DNI del padre/tutor.")
        _validar_archivo_documento(dni_tutor_file, "DNI del Tutor")
        if not post.get("tutor_nombre") or not post.get("tutor_dni"):
            raise HttpError(400, "Al ser menor de edad, debe ingresar nombre y DNI del tutor.")
    else:
        _validar_archivo_documento(titulo_file, "Título secundario")

    with transaction.atomic():
        estudiante = Estudiante.objects.filter(dni=dni).first()
        if not estudiante:
            estudiante = Estudiante(dni=dni)

        serializer_data = {
            "email": post.get("email", ""),
            "apellido": post.get("apellido", ""),
            "nombre": post.get("nombre", ""),
            "dni": dni,
            "cuit": post.get("cuit", ""),
            "sexo": post.get("sexo", ""),
            "fecha_nacimiento": fecha_nac,
            "pais_nacimiento": post.get("pais_nacimiento", ""),
            "pais_nacimiento_otro": post.get("pais_nacimiento_otro", ""),
            "nacionalidad": post.get("nacionalidad", ""),
            "nacionalidad_otra": post.get("nacionalidad_otra", ""),
            "lugar_nacimiento": post.get("lugar_nacimiento", ""),
            "domicilio": post.get("domicilio", ""),
            "barrio": post.get("barrio", ""),
            "ciudad": post.get("ciudad", ""),
            "telefono": post.get("telefono", ""),
            "nivel_educativo": post.get("nivel_educativo", ""),
            "posee_pc": _as_bool(post.get("posee_pc"), False),
            "posee_conectividad": _as_bool(post.get("posee_conectividad"), False),
            "puede_traer_pc": _as_bool(post.get("puede_traer_pc"), False),
            "trabaja": _as_bool(post.get("trabaja"), False),
            "lugar_trabajo": post.get("lugar_trabajo", ""),
            "tutor_nombre": post.get("tutor_nombre", ""),
            "tutor_dni": post.get("tutor_dni", ""),
        }

        serializer = EstudianteSerializer(instance=estudiante, data=serializer_data, partial=True)
        from rest_framework.exceptions import ValidationError as DRFValidationError
        try:
            serializer.is_valid(raise_exception=True)
        except DRFValidationError as ve:
            # Convertir errores de DRF a un mensaje legible
            errors = serializer.errors
            first_field = list(errors.keys())[0]
            first_msg = errors[first_field]
            msg = f"{first_field}: {first_msg[0]}" if isinstance(first_msg, list) else str(first_msg)
            raise HttpError(400, msg)
        estudiante = serializer.save()

        todas_habilitadas = _cohortes_habilitadas()
        cohortes: List[Cohorte] = []
        for seleccion in seleccion_programas:
            programa_id = seleccion["programa_id"]
            cohortes_habilitadas = [c for c in todas_habilitadas if c.programa_id == programa_id]
            if not cohortes_habilitadas:
                raise HttpError(400, f"El programa {programa_id} no tiene cohortes habilitadas.")

            cohortes_por_bloque = {c.bloque_id: c for c in cohortes_habilitadas}
            bloques_disponibles = set(cohortes_por_bloque.keys())
            bloques_seleccionados = seleccion["bloque_ids"] or sorted(list(bloques_disponibles))
            bloques_seleccionados = [int(b) for b in bloques_seleccionados]

            if not bloques_seleccionados:
                raise HttpError(400, f"Debe seleccionar al menos un bloque para el programa {programa_id}.")
            if any(b not in bloques_disponibles for b in bloques_seleccionados):
                raise HttpError(400, f"Uno o más bloques seleccionados no están habilitados para el programa {programa_id}.")

            cohortes.extend([cohortes_por_bloque[b] for b in bloques_seleccionados])

        _validar_correlativas(estudiante.id, cohortes)
        
        # Validación de título solo para mayores
        if not es_menor:
            requiere_titulo = any(_programa_requiere_titulo(c.programa) for c in cohortes)
            if requiere_titulo and not (titulo_file or estudiante.titulo_secundario_digitalizado):
                raise HttpError(
                    400,
                    "Al menos un bloque seleccionado requiere archivo de título secundario.",
                )

        estudiante.dni_digitalizado = dni_file
        if not es_menor and titulo_file:
            estudiante.titulo_secundario_digitalizado = titulo_file
        
        if es_menor and dni_tutor_file:
            estudiante.dni_tutor_digitalizado = dni_tutor_file

        estudiante.estatus = "Preinscripto"

        update_fields = ["dni_digitalizado", "estatus", "updated_at"]
        if not es_menor and titulo_file:
            update_fields.append("titulo_secundario_digitalizado")
        if es_menor and dni_tutor_file:
            update_fields.append("dni_tutor_digitalizado")
            
        estudiante.save(update_fields=update_fields)

        inscripciones_creadas = []
        inscripciones_existentes = []
        for cohorte in cohortes:
            modulo_inicial = Modulo.objects.filter(bloque_id=cohorte.bloque_id).order_by("id").first()
            if not modulo_inicial:
                raise HttpError(400, f"La cohorte '{cohorte.nombre}' no tiene módulos configurados.")

            previas_bloque = list(
                Inscripcion.objects.filter(
                    estudiante=estudiante,
                    modulo__bloque_id=cohorte.bloque_id,
                ).values_list("id", flat=True)
            )
            if previas_bloque:
                inscripciones_existentes.extend(previas_bloque)
                continue

            insc = Inscripcion.objects.filter(
                estudiante=estudiante,
                cohorte=cohorte,
                modulo_id=modulo_inicial.id,
            ).first()
            if insc:
                inscripciones_existentes.append(insc.id)
                continue

            created = Inscripcion.objects.create(
                estudiante=estudiante,
                cohorte=cohorte,
                modulo_id=modulo_inicial.id,
                estado=Inscripcion.INSCRIPTO,
            )
            inscripciones_creadas.append(created.id)

    # Disparar email en segundo plano
    threading.Thread(target=_enviar_confirmacion_preinscripcion, args=(estudiante, cohortes)).start()

    return PreinscripcionOut(
        ok=True,
        estudiante_id=estudiante.id,
        estatus=estudiante.estatus,
        inscripciones_creadas=inscripciones_creadas,
        inscripciones_existentes=inscripciones_existentes,
        mensaje="Preinscripción registrada correctamente.",
    )
