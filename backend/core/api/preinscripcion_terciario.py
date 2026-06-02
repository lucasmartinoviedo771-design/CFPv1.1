from ninja import Router, Schema
from ninja.errors import HttpError
from django.utils import timezone
from django.db import transaction
from typing import Optional, List, Any
from datetime import date
import html
import re
from ..models import PreinscripcionTerciario, Inscripcion, Modulo, Cohorte, Estudiante, ConfiguracionPreinscripcionTerciario
import threading
from django.core.mail import send_mail
from django.conf import settings

MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024  # 3MB
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}


def _validar_archivo(file_obj, field_label: str):
    if not file_obj:
        return
    if file_obj.size > MAX_FILE_SIZE_BYTES:
        raise HttpError(400, f"{field_label}: tamaño máximo permitido 3MB.")
    name = (file_obj.name or "").lower()
    ext = "." + name.split(".")[-1] if "." in name else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HttpError(400, f"{field_label}: formato no permitido. Usá PDF o imagen.")
    try:
        import magic
        mime = magic.from_buffer(file_obj.read(2048), mime=True)
        file_obj.seek(0)
        if mime not in ALLOWED_CONTENT_TYPES:
            raise HttpError(400, f"{field_label}: el contenido del archivo no coincide con su extensión.")
    except ImportError:
        content_type = (getattr(file_obj, "content_type", "") or "").lower()
        if content_type and content_type not in ALLOWED_CONTENT_TYPES:
            raise HttpError(400, f"{field_label}: tipo de archivo no permitido.")

router = Router(tags=["preinscripcion-terciario"])

MODULO_HD2_ID = 19       # Módulo 2 Habilidades Digitales

def _get_prog_id() -> int:
    try:
        cfg = ConfiguracionPreinscripcionTerciario.get()
        if cfg.programa_terciario_id:
            return cfg.programa_terciario_id
    except Exception:
        pass
    try:
        from ..models import Programa
        p = Programa.objects.filter(nombre__icontains="Tecnicatura Superior").order_by("-id").first()
        if p:
            return p.id
    except Exception:
        pass
    return 7

# Grupos con acceso al panel Terciario
GRUPOS_TERCIARIO = ["Admin", "Terciario", "Rector"]


def _tiene_acceso_terciario(user):
    """Solo superusuarios o miembros de grupos con acceso Terciario."""
    if user.is_superuser:
        return True
    return user.groups.filter(name__in=GRUPOS_TERCIARIO).exists()


def _check_terciario(user):
    if not _tiene_acceso_terciario(user):
        raise HttpError(403, "Sin permisos para acceder al panel Terciario.")


def _get_cohorte_hd_activa():
    """Devuelve la cohorte de la Tecnicatura activa hoy, o la próxima a comenzar."""
    from django.utils.timezone import now
    hoy = now().date()
    cohorte = (
        Cohorte.objects.filter(programa_id=_get_prog_id(), fecha_inicio__lte=hoy, fecha_fin__gte=hoy)
        .order_by("fecha_inicio")
        .first()
    )
    if cohorte:
        return cohorte
    cohorte = (
        Cohorte.objects.filter(programa_id=_get_prog_id(), fecha_inicio__gt=hoy)
        .order_by("fecha_inicio")
        .first()
    )
    return cohorte


def _inscribir_hd(preinscripcion: PreinscripcionTerciario):
    try:
        cfg = ConfiguracionPreinscripcionTerciario.get()
        cohorte = cfg.hd_cohorte
        if not cohorte:
            cohorte = _get_cohorte_hd_activa()
        if not cohorte:
            return  # No hay cohorte activa ni próxima
        mod2 = Modulo.objects.get(id=MODULO_HD2_ID)

        # Buscar o crear estudiante por DNI o email
        estudiante = (
            Estudiante.objects.filter(dni=preinscripcion.dni).first()
            or Estudiante.objects.filter(email=preinscripcion.email).first()
        )
        if not estudiante:
            estudiante = Estudiante.objects.create(
                dni=preinscripcion.dni,
                apellido=preinscripcion.apellido,
                nombre=preinscripcion.nombre,
                email=preinscripcion.email,
                telefono=preinscripcion.celular,
                domicilio=preinscripcion.domicilio,
                fecha_nacimiento=preinscripcion.fecha_nacimiento,
                sexo=preinscripcion.sexo,
                nacionalidad=preinscripcion.nacionalidad,
                estatus="Preinscripto",
            )

        # Crear inscripción si no existe
        inscripcion, created = Inscripcion.objects.get_or_create(
            estudiante=estudiante,
            modulo=mod2,
            cohorte=cohorte,
            defaults={"estado": "CURSANDO"},
        )

        preinscripcion.hd_inscripcion = inscripcion
        preinscripcion.save(update_fields=["hd_inscripcion"])
    except Exception as e:
        pass


def _enviar_confirmacion(preinscripcion: PreinscripcionTerciario):
    try:
        from django.core.mail import EmailMessage
        subject = "Bienvenidos/as a la Tecnicatura — Todo lo que necesitás saber para comenzar"
        apellido_safe = html.escape(preinscripcion.apellido)
        nombre_safe = html.escape(preinscripcion.nombre)
        dni_safe = html.escape(preinscripcion.dni)
        email_safe = html.escape(preinscripcion.email)

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f5; }}
                .container {{ max-width: 650px; margin: 0 auto; background-color: #ffffff; overflow: hidden; }}
                .header {{ background-color: #1a1f4e; color: #ffffff; padding: 25px 20px; text-align: center; border-bottom: 5px solid #f5c518; }}
                .header h1 {{ margin: 0; font-size: 24px; letter-spacing: 0.5px; }}
                .header h2 {{ margin: 5px 0 0 0; font-size: 16px; font-weight: normal; color: #b8ccd8; }}
                .content {{ padding: 30px 35px; }}
                .highlight-box {{ background-color: #f8fafc; padding: 20px; border-left: 4px solid #f5c518; margin: 25px 0; border-radius: 0 8px 8px 0; }}
                .highlight-box h3 {{ color: #1a1f4e; margin-top: 0; margin-bottom: 10px; font-size: 18px; }}
                .btn {{ display: inline-block; padding: 12px 24px; background-color: #1a1f4e; color: #ffffff !important; text-decoration: none; font-weight: bold; border-radius: 8px; margin-top: 10px; }}
                .date-box {{ background-color: #eef2f7; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; font-size: 16px; font-weight: bold; color: #1a1f4e; }}
                .checklist {{ background-color: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; margin: 25px 0; }}
                .checklist h3 {{ color: #166534; margin-top: 0; }}
                .contacto-box {{ background-color: #f1f5f9; padding: 25px; border-radius: 8px; font-size: 15px; margin-top: 30px; border: 1px solid #e2e8f0; }}
                .contacto-item {{ margin-bottom: 8px; line-height: 1.5; }}
                .footer {{ background-color: #0f172a; color: #e2e8f0; text-align: center; padding: 25px 20px; font-size: 15px; font-weight: bold; letter-spacing: 0.5px; }}
                a {{ color: #0284c7; text-decoration: none; font-weight: 600; }}
                a:hover {{ text-decoration: underline; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Centro Politécnico Superior</h1>
                    <h2>Tecnicatura Superior en Ciencia de Datos e Inteligencia Artificial</h2>
                </div>
                <div class="content">
                    <p style="font-size: 17px; margin-top: 0;">Estimado/a <strong>{apellido_safe}, {nombre_safe}</strong>,</p>
                    <p>¡Bienvenidos/as a esta nueva etapa! Tu preinscripción fue recibida correctamente. Están a punto de comenzar un camino apasionante en el mundo de los datos y la inteligencia artificial, y queremos acompañarlos/as desde el primer paso.</p>
                    
                    <p>A continuación les compartimos información importante sobre el curso introductorio y el inicio de la cursada:</p>

                    <div class="highlight-box">
                        <h3>🎯 INTROTEC</h3>
                        <p>Es el curso de ingreso <strong>obligatorio y no eliminatorio</strong> de la Tecnicatura — no es un filtro, es un <strong>puente</strong>. Te acompaña en tus primeros pasos en el nivel terciario virtual con contenidos de <strong>inglés técnico y matemática</strong>, y te introduce al campus Moodle y las habilidades digitales necesarias para cursar.</p>
                        <a href="https://view.genially.com/6a10ecab5a7c072980bbb3a2" target="_blank" class="btn">Mirá la Presentación aquí</a>
                    </div>

                    <div class="date-box">
                        📅 Fecha de inicio del INTROTEC: 31/07/2026 a las 19:00 hs.
                    </div>

                    <div class="highlight-box" style="border-left-color: #0284c7;">
                        <h3 style="color: #0284c7;">💻 Curso de Habilidades Digitales</h3>
                        <p>Dentro del INTROTEC encontrarás este curso — <strong>autogestionado y disponible desde este momento</strong>. Recorre Moodle, Herramientas de Google, Inteligencia Artificial y presentaciones. Al completarlo obtenés un certificado oficial del CFP.</p>
                        <p><em>No es obligatorio, pero es muy recomendable si estás dando tus primeros pasos en el mundo digital. ¡Podés hacerlo en cualquier momento del cuatrimestre!</em></p>
                        <a href="https://view.genially.com/6a15e9e0cddf7419df1c20d0" target="_blank" class="btn" style="background-color: #0284c7;">Ver Presentación del Curso</a>
                    </div>

                    <div class="checklist">
                        <h3>📌 Primeros Pasos</h3>
                        <p>Para acceder, primero <strong>registrate</strong> en el campus siguiendo los pasos de la <strong>Hoja de Ruta</strong>. Mirá con detenimiento la Hoja de Ruta, allí se explica:</p>
                        <ul style="color: #166534;">
                            <li>✅ Registro en el campus.</li>
                            <li>✅ Fechas importantes.</li>
                            <li>✅ Equivalencias.</li>
                            <li>✅ Entrega de documentación.</li>
                        </ul>
                        <a href="https://view.genially.com/69fe7b75e3792921111bbaac" target="_blank" style="display: inline-block; margin-top: 10px; font-weight: bold; color: #166534; text-decoration: underline;">👉 Abrir Hoja de Ruta</a>
                    </div>

                    <div class="contacto-box">
                        <p style="margin-top: 0; font-weight: bold; color: #1a1f4e;">Ante cualquier inquietud, ¡estamos para ayudarte!</p>
                        <div class="contacto-item">📍 <strong>Río Grande:</strong> <a href="mailto:Tutoria.cetns.rg@gmail.com">Tutoria.cetns.rg@gmail.com</a></div>
                        <div class="contacto-item">📍 <strong>Ushuaia:</strong> <a href="mailto:Tutoria.cetns.ush@tdf.edu.ar">Tutoria.cetns.ush@tdf.edu.ar</a></div>
                        <div class="contacto-item">📍 <strong>Tolhuin:</strong> <a href="mailto:Tutoria.cetns.tol@tdf.edu.ar">Tutoria.cetns.tol@tdf.edu.ar</a></div>
                    </div>
                    
                    <p style="margin-top: 30px; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                        <em>Datos registrados: Apellido: {apellido_safe} | Nombre: {nombre_safe} | DNI: {dni_safe}</em>
                    </p>
                </div>
                <div class="footer">
                    Este es un mensaje automático del Centro Politécnico Superior.<br>Por favor, no respondas a este correo.
                </div>
            </div>
        </body>
        </html>
        """
        
        email = EmailMessage(
            subject=subject,
            body=html_content,
            from_email=settings.TERCIARIO_FROM_EMAIL,
            to=[preinscripcion.email],
        )
        email.content_subtype = "html"
        email.send(fail_silently=True)
    except Exception:
        pass


def _esta_abierta(cfg):
    """Si hay fechas configuradas, el período manda. Si no, usa el toggle manual."""
    from datetime import date, datetime
    hoy = date.today()
    
    fecha_ini = cfg.fecha_inicio
    fecha_fi = cfg.fecha_fin
    
    if isinstance(fecha_ini, str) and fecha_ini:
        try:
            fecha_ini = datetime.strptime(fecha_ini, "%Y-%m-%d").date()
        except ValueError:
            pass
    if isinstance(fecha_fi, str) and fecha_fi:
        try:
            fecha_fi = datetime.strptime(fecha_fi, "%Y-%m-%d").date()
        except ValueError:
            pass

    if fecha_ini and fecha_fi:
        return fecha_ini <= hoy <= fecha_fi
    if fecha_ini:
        return hoy >= fecha_ini
    if fecha_fi:
        return hoy <= fecha_fi
    return cfg.preinscripcion_abierta


def _cfg_to_dict(cfg):
    return {
        "abierta": _esta_abierta(cfg),
        "abierta_manual": cfg.preinscripcion_abierta,
        "fecha_inicio": str(cfg.fecha_inicio) if cfg.fecha_inicio else None,
        "fecha_fin": str(cfg.fecha_fin) if cfg.fecha_fin else None,
        "mensaje_cierre": cfg.mensaje_cierre,
        "hd_cohorte_id": cfg.hd_cohorte_id,
        "hd_cohorte_nombre": cfg.hd_cohorte.nombre if cfg.hd_cohorte_id else None,
    }


@router.get("/preinscripcion-terciario-config", auth=None)
def get_config_preinscripcion(request):
    return _cfg_to_dict(ConfiguracionPreinscripcionTerciario.get())


@router.get("/preinscripcion-terciario-cohortes-hd")
def listar_cohortes_hd(request):
    """Lista cohortes de HD Módulo 2 disponibles para asignar."""
    if not _tiene_acceso_terciario(request.user):
        raise HttpError(403, "Sin permisos.")
    cohortes = (
        Cohorte.objects.filter(programa_id=_get_prog_id())
        .order_by("-id")
        .values("id", "nombre", "fecha_inicio", "fecha_fin")[:30]
    )
    return [
        {
            "id": c["id"],
            "nombre": c["nombre"],
            "fecha_inicio": str(c["fecha_inicio"]) if c["fecha_inicio"] else None,
            "fecha_fin": str(c["fecha_fin"]) if c["fecha_fin"] else None,
        }
        for c in cohortes
    ]


@router.patch("/preinscripcion-terciario-config")
def set_config_preinscripcion(
    request,
    abierta: Optional[bool] = None,
    fecha_inicio: str = "",
    fecha_fin: str = "",
    mensaje_cierre: str = "",
    hd_cohorte_id: Optional[int] = None,
):
    if not _tiene_acceso_terciario(request.user):
        raise HttpError(403, "Sin permisos.")
    cfg = ConfiguracionPreinscripcionTerciario.get()
    update_fields = []
    if abierta is not None:
        cfg.preinscripcion_abierta = abierta
        update_fields.append("preinscripcion_abierta")
    if fecha_inicio:
        cfg.fecha_inicio = fecha_inicio
        update_fields.append("fecha_inicio")
    if fecha_fin:
        cfg.fecha_fin = fecha_fin
        update_fields.append("fecha_fin")
    if mensaje_cierre:
        cfg.mensaje_cierre = mensaje_cierre
        update_fields.append("mensaje_cierre")
    if hd_cohorte_id is not None:
        cfg.hd_cohorte_id = hd_cohorte_id if hd_cohorte_id > 0 else None
        update_fields.append("hd_cohorte_id")
    if update_fields:
        cfg.save(update_fields=update_fields)
        cfg.refresh_from_db()
    return _cfg_to_dict(cfg)


@router.post("/preinscripcion-terciario", auth=None)
def crear_preinscripcion_terciario(request):
    """Acepta multipart/form-data con archivos opcionales."""
    cfg = ConfiguracionPreinscripcionTerciario.get()
    if not _esta_abierta(cfg):
        raise HttpError(403, cfg.mensaje_cierre or "Las preinscripciones están cerradas.")

    data = request.POST
    files = request.FILES

    # Validación de Seguridad reCAPTCHA v3
    from core.utils.recaptcha import verify_recaptcha
    recaptcha_token = data.get("recaptcha_token", "")
    if not verify_recaptcha(recaptcha_token, action="preinscripcion_terciario"):
        raise HttpError(400, "Fallo la validación de seguridad (reCAPTCHA). Por favor intente nuevamente.")

    localidad = data.get("localidad", "")
    if localidad == "otras":
        raise HttpError(400, "La Tecnicatura es solo para residentes de Tierra del Fuego.")

    dni = re.sub(r"\D", "", data.get("dni", "").strip())
    if not dni:
        raise HttpError(400, "El DNI es obligatorio.")
    if len(dni) != 8:
        raise HttpError(400, "El DNI debe tener 8 dígitos.")

    if PreinscripcionTerciario.objects.filter(dni=dni).exists():
        raise HttpError(400, "Ya existe una preinscripción registrada con ese DNI.")

    def to_bool(val):
        if isinstance(val, bool):
            return val
        return str(val).lower() in ("true", "1", "si", "yes")

    def to_bool_or_none(val):
        if val in (None, "", "null", "undefined"):
            return None
        return to_bool(val)

    _validar_archivo(files.get("dni_digitalizado"), "DNI")
    _validar_archivo(files.get("titulo_digitalizado"), "Título secundario")

    try:
        preinscripcion = PreinscripcionTerciario.objects.create(
            email=data.get("email", "").strip(),
            apellido=data.get("apellido", "").strip(),
            nombre=data.get("nombre", "").strip(),
            dni=dni,
            cuil=data.get("cuil", "").strip(),
            sexo=data.get("sexo", ""),
            celular=data.get("celular", "").strip(),
            fecha_nacimiento=data.get("fecha_nacimiento", ""),
            localidad_nacimiento=data.get("localidad_nacimiento", "").strip(),
            provincia_nacimiento=data.get("provincia_nacimiento", "").strip(),
            nacionalidad=data.get("nacionalidad", "Argentina").strip(),
            domicilio=data.get("domicilio", "").strip(),
            localidad=localidad,
            finalizo_secundaria=data.get("finalizo_secundaria", ""),
            posee_estudios_superiores=to_bool(data.get("posee_estudios_superiores", False)),
            estudios_superiores_finalizado=to_bool_or_none(data.get("estudios_superiores_finalizado")),
            estudios_superiores_carrera=data.get("estudios_superiores_carrera", ""),
            posee_pc=to_bool(data.get("posee_pc", False)),
            posee_internet=to_bool(data.get("posee_internet", False)),
            pueblo_originario=to_bool(data.get("pueblo_originario", False)),
            posee_discapacidad=to_bool(data.get("posee_discapacidad", False)),
            tipo_discapacidad=data.get("tipo_discapacidad", ""),
            posee_cud=to_bool_or_none(data.get("posee_cud")),
            apoyo_inclusion=data.get("apoyo_inclusion", ""),
            requiere_apoyo_especifico=to_bool_or_none(data.get("requiere_apoyo_especifico")),
            descripcion_apoyo=data.get("descripcion_apoyo", ""),
            dni_digitalizado=files.get("dni_digitalizado") or None,
            titulo_digitalizado=files.get("titulo_digitalizado") or None,
        )
    except HttpError:
        raise
    except Exception:
        raise HttpError(400, "Error al guardar la preinscripción. Revisá los datos e intentá nuevamente.")

    threading.Thread(target=_enviar_confirmacion, args=(preinscripcion,)).start()

    return {"id": preinscripcion.id, "mensaje": "Preinscripción registrada correctamente."}


class PreinscripcionTerciarioListOut(Schema):
    id: int
    email: str
    apellido: str
    nombre: str
    dni: str
    cuil: str
    sexo: str
    celular: str
    fecha_nacimiento: Any
    localidad_nacimiento: str
    provincia_nacimiento: str
    nacionalidad: str
    domicilio: str
    localidad: str
    finalizo_secundaria: str
    posee_estudios_superiores: bool
    estudios_superiores_finalizado: Optional[bool]
    estudios_superiores_carrera: str
    posee_pc: bool
    posee_internet: bool
    pueblo_originario: bool
    posee_discapacidad: bool
    tipo_discapacidad: str
    posee_cud: Optional[bool]
    apoyo_inclusion: str
    requiere_apoyo_especifico: Optional[bool]
    descripcion_apoyo: str
    tiene_dni: bool
    tiene_titulo: bool
    url_dni: Optional[str]
    url_titulo: Optional[str]
    estado: str
    observaciones: str
    created_at: str
    hd_estado: Optional[str]
    apellido_nombre: str

    @staticmethod
    def resolve_apellido_nombre(obj):
        # Concatenate last name and first name cleanly
        return f"{obj.apellido}, {obj.nombre}".strip(", ")

    @staticmethod
    def resolve_created_at(obj):

        return obj.created_at.strftime("%Y-%m-%d %H:%M") if obj.created_at else ""

    @staticmethod
    def resolve_fecha_nacimiento(obj):
        return str(obj.fecha_nacimiento) if obj.fecha_nacimiento else ""

    @staticmethod
    def resolve_tiene_dni(obj):
        return bool(obj.dni_digitalizado)

    @staticmethod
    def resolve_tiene_titulo(obj):
        return bool(obj.titulo_digitalizado)

    @staticmethod
    def resolve_url_dni(obj):
        return f"/media/{obj.dni_digitalizado.name}" if obj.dni_digitalizado else None

    @staticmethod
    def resolve_url_titulo(obj):
        return f"/media/{obj.titulo_digitalizado.name}" if obj.titulo_digitalizado else None

    @staticmethod
    def resolve_hd_estado(obj):
        if obj.hd_inscripcion_id:
            try:
                return obj.hd_inscripcion.estado
            except Exception:
                return None
        return None


@router.get("/preinscripciones-terciario", response=List[PreinscripcionTerciarioListOut])
def listar_preinscripciones_terciario(request, estado: str = "", localidad: str = ""):
    if not _tiene_acceso_terciario(request.user):
        raise HttpError(403, "Sin permisos.")
    qs = PreinscripcionTerciario.objects.select_related("hd_inscripcion").all().order_by("-created_at")
    if estado:
        qs = qs.filter(estado=estado)
    if localidad:
        qs = qs.filter(localidad=localidad)
    return list(qs)


@router.patch("/preinscripciones-terciario/{preinscripcion_id}/docs")
def actualizar_docs_terciario(request, preinscripcion_id: int):
    if not _tiene_acceso_terciario(request.user):
        raise HttpError(403, "Sin permisos.")
    try:
        p = PreinscripcionTerciario.objects.get(id=preinscripcion_id)
    except PreinscripcionTerciario.DoesNotExist:
        raise HttpError(404, "No encontrada.")
    files = request.FILES
    if "dni_digitalizado" in files:
        p.dni_digitalizado = files["dni_digitalizado"]
    if "titulo_digitalizado" in files:
        p.titulo_digitalizado = files["titulo_digitalizado"]
    p.save()
    return {"id": p.id, "url_dni": f"/media/{p.dni_digitalizado.name}" if p.dni_digitalizado else None,
            "url_titulo": f"/media/{p.titulo_digitalizado.name}" if p.titulo_digitalizado else None}


@router.patch("/preinscripciones-terciario/{preinscripcion_id}")
def actualizar_preinscripcion_terciario(
    request, preinscripcion_id: int, estado: str = "", observaciones: str = ""
):
    if not _tiene_acceso_terciario(request.user):
        raise HttpError(403, "Sin permisos.")
    try:
        p = PreinscripcionTerciario.objects.get(id=preinscripcion_id)
    except PreinscripcionTerciario.DoesNotExist:
        raise HttpError(404, "No encontrada.")

    prev_estado = p.estado
    if estado:
        p.estado = estado
    if observaciones:
        p.observaciones = observaciones
    p.save()

    if estado == "aprobada" and prev_estado != "aprobada" and not p.hd_inscripcion_id:
        threading.Thread(target=_inscribir_hd, args=(p,)).start()

    return {"id": p.id, "mensaje": "Actualizado correctamente."}


@router.get("/preinscripciones-terciario-cohorte")
def get_cohorte_terciario(request, cohorte_id: Optional[int] = None):
    if not _tiene_acceso_terciario(request.user):
        raise HttpError(403, "Sin permisos.")
    try:
        if cohorte_id:
            cohorte = Cohorte.objects.get(id=cohorte_id, programa_id=_get_prog_id())
        else:
            cfg = ConfiguracionPreinscripcionTerciario.get()
            cohorte = cfg.hd_cohorte or _get_cohorte_hd_activa()
        if not cohorte:
            raise Cohorte.DoesNotExist()
        inscripciones = (
            Inscripcion.objects
            .filter(cohorte=cohorte, modulo_id=MODULO_HD2_ID)
            .select_related("estudiante")
            .order_by("estudiante__apellido")
        )
        estudiantes = [
            {
                "id": i.estudiante.id,
                "apellido": i.estudiante.apellido,
                "nombre": i.estudiante.nombre,
                "dni": i.estudiante.dni,
                "email": i.estudiante.email,
                "estado": i.estado,
                "inscripcion_id": i.id,
            }
            for i in inscripciones
        ]
        return {
            "id": cohorte.id,
            "nombre": cohorte.nombre,
            "fecha_inicio": str(cohorte.fecha_inicio) if cohorte.fecha_inicio else None,
            "fecha_fin": str(cohorte.fecha_fin) if cohorte.fecha_fin else None,
            "inscriptos": len(estudiantes),
            "estudiantes": estudiantes,
        }
    except Cohorte.DoesNotExist:
        return {
            "id": None, "nombre": None,
            "fecha_inicio": None, "fecha_fin": None,
            "inscriptos": 0, "estudiantes": [],
        }


@router.patch("/preinscripciones-terciario-cohorte/inscripcion/{inscripcion_id}")
def actualizar_estado_inscripcion_terciario(request, inscripcion_id: int, estado: str = ""):
    if not _tiene_acceso_terciario(request.user):
        raise HttpError(403, "Sin permisos.")
    ESTADOS_VALIDOS = ["CURSANDO", "APROBADO", "DESAPROBADO", "INACTIVO"]
    if estado not in ESTADOS_VALIDOS:
        raise HttpError(400, f"Estado inválido. Opciones: {', '.join(ESTADOS_VALIDOS)}")
    try:
        insc = Inscripcion.objects.get(id=inscripcion_id, modulo_id=MODULO_HD2_ID)
    except Inscripcion.DoesNotExist:
        raise HttpError(404, "Inscripción no encontrada.")
    insc.estado = estado
    insc.save(update_fields=["estado"])
    return {"id": insc.id, "estado": insc.estado}


@router.patch("/preinscripciones-terciario-cohorte")
def actualizar_cohorte_terciario(
    request, nombre: str = "", fecha_inicio: str = "", fecha_fin: str = ""
):
    if not _tiene_acceso_terciario(request.user):
        raise HttpError(403, "Sin permisos.")
    cohorte, _ = Cohorte.objects.get_or_create(
        nombre=HD_COHORTE_TERCIARIO_NOMBRE,
        defaults={"programa_id": 2, "bloque_fechas_id": 4},
    )
    update_fields = []
    if nombre:
        cohorte.nombre = nombre
        update_fields.append("nombre")
    if fecha_inicio:
        cohorte.fecha_inicio = fecha_inicio
        update_fields.append("fecha_inicio")
    if fecha_fin:
        cohorte.fecha_fin = fecha_fin
        update_fields.append("fecha_fin")
    if update_fields:
        cohorte.save(update_fields=update_fields)
    inscriptos = Inscripcion.objects.filter(cohorte=cohorte, modulo_id=MODULO_HD2_ID).count()
    return {
        "id": cohorte.id, "nombre": cohorte.nombre,
        "fecha_inicio": str(cohorte.fecha_inicio) if cohorte.fecha_inicio else None,
        "fecha_fin": str(cohorte.fecha_fin) if cohorte.fecha_fin else None,
        "inscriptos": inscriptos,
    }


@router.get("/preinscripciones-terciario-stats")
def stats_preinscripciones_terciario(request):
    if not _tiene_acceso_terciario(request.user):
        raise HttpError(403, "Sin permisos.")
    from django.db.models import Count
    qs = PreinscripcionTerciario.objects
    return {
        "total": qs.count(),
        "pendiente": qs.filter(estado="pendiente").count(),
        "aprobada": qs.filter(estado="aprobada").count(),
        "rechazada": qs.filter(estado="rechazada").count(),
        "con_hd": qs.filter(hd_inscripcion__isnull=False).count(),
        "por_localidad": list(qs.values("localidad").annotate(total=Count("id"))),
        "con_discapacidad": qs.filter(posee_discapacidad=True).count(),
        "pueblo_originario": qs.filter(pueblo_originario=True).count(),
    }


@router.get("/terciario-alumnos")
def listar_alumnos_terciario(
    request,
    cohorte_id: Optional[int] = None,
    estado: Optional[str] = None,
    q: Optional[str] = None,
):
    """Lista todos los inscriptos en cohortes del programa Terciario (programa_id=7)."""
    if not _tiene_acceso_terciario(request.user):
        raise HttpError(403, "Sin permisos.")

    qs = (
        Inscripcion.objects
        .filter(cohorte__programa_id=_get_prog_id(), modulo_id=MODULO_HD2_ID)
        .select_related("estudiante", "cohorte")
        .order_by("estudiante__apellido", "estudiante__nombre")
    )

    if cohorte_id:
        qs = qs.filter(cohorte_id=cohorte_id)
    if estado:
        qs = qs.filter(estado=estado)
    if q:
        from django.db.models import Q as DQ
        qs = qs.filter(
            DQ(estudiante__apellido__icontains=q) |
            DQ(estudiante__nombre__icontains=q) |
            DQ(estudiante__dni__icontains=q) |
            DQ(estudiante__email__icontains=q)
        )

    result = []
    for ins in qs:
        e = ins.estudiante
        preinsc = PreinscripcionTerciario.objects.filter(dni=e.dni).order_by("-created_at").first()
        row = {
            "inscripcion_id": ins.id,
            "cohorte_id": ins.cohorte_id,
            "cohorte_nombre": ins.cohorte.nombre,
            "estado": ins.estado,
            "estado_hd": ins.estado,
            # Datos personales
            "apellido": e.apellido,
            "nombre": e.nombre,
            "dni": e.dni,
            "email": e.email,
            "telefono": e.telefono,
            "sexo": e.sexo,
            "fecha_nacimiento": str(e.fecha_nacimiento) if e.fecha_nacimiento else None,
            "domicilio": e.domicilio,
            "barrio": e.barrio,
            "ciudad": e.ciudad,
            "nacionalidad": e.nacionalidad,
            "nivel_educativo": e.nivel_educativo,
            "estatus": e.estatus,
            "posee_pc": e.posee_pc,
            "posee_conectividad": e.posee_conectividad,
        }
        row.update({
            "celular_preinsc": preinsc.celular if preinsc else "",
            "localidad": preinsc.get_localidad_display() if preinsc else "",
            "localidad_nacimiento": preinsc.localidad_nacimiento if preinsc else "",
            "provincia_nacimiento": preinsc.provincia_nacimiento if preinsc else "",
            "finalizo_secundaria": preinsc.finalizo_secundaria if preinsc else "",
            "posee_estudios_superiores": preinsc.posee_estudios_superiores if preinsc else False,
            "carrera_superior": preinsc.estudios_superiores_carrera if preinsc else "",
            "pueblo_originario": preinsc.pueblo_originario if preinsc else False,
            "posee_discapacidad": preinsc.posee_discapacidad if preinsc else False,
            "tipo_discapacidad": preinsc.tipo_discapacidad if preinsc else "",
            "posee_cud": preinsc.posee_cud if preinsc else None,
            "estado_preinscripcion": preinsc.estado if preinsc else "",
            "observaciones": preinsc.observaciones if preinsc else "",
        })
        result.append(row)
    return result


@router.get("/terciario-cohorte-export")
def exportar_cohorte_terciario(request, cohorte_id: Optional[int] = None):
    """Exportación completa: datos de inscripción HD + datos de preinscripción terciario."""
    if not _tiene_acceso_terciario(request.user):
        raise HttpError(403, "Sin permisos.")

    qs = (
        Inscripcion.objects
        .filter(cohorte__programa_id=_get_prog_id(), modulo_id=MODULO_HD2_ID)
        .select_related("estudiante", "cohorte")
        .order_by("estudiante__apellido", "estudiante__nombre")
    )
    if cohorte_id:
        qs = qs.filter(cohorte_id=cohorte_id)

    result = []
    for ins in qs:
        e = ins.estudiante
        # Buscar preinscripcion asociada por DNI
        preinsc = PreinscripcionTerciario.objects.filter(dni=e.dni).order_by("-created_at").first()
        row = {
            "cohorte": ins.cohorte.nombre,
            "estado_hd": ins.estado,
            # Datos personales del estudiante
            "apellido": e.apellido,
            "nombre": e.nombre,
            "dni": e.dni,
            "email": e.email,
            "telefono": e.telefono,
            "sexo": e.sexo,
            "fecha_nacimiento": str(e.fecha_nacimiento) if e.fecha_nacimiento else None,
            "domicilio": e.domicilio,
            "barrio": e.barrio,
            "ciudad": e.ciudad,
            "nacionalidad": e.nacionalidad,
            "nivel_educativo": e.nivel_educativo,
            "posee_pc": e.posee_pc,
            "posee_conectividad": e.posee_conectividad,
        }
        # Datos de preinscripción (siempre presentes, vacíos si no existe)
        row.update({
            "celular_preinsc": preinsc.celular if preinsc else "",
            "localidad": preinsc.get_localidad_display() if preinsc else "",
            "localidad_nacimiento": preinsc.localidad_nacimiento if preinsc else "",
            "provincia_nacimiento": preinsc.provincia_nacimiento if preinsc else "",
            "finalizo_secundaria": preinsc.get_finalizo_secundaria_display() if preinsc else "",
            "posee_estudios_superiores": preinsc.posee_estudios_superiores if preinsc else "",
            "carrera_superior": preinsc.estudios_superiores_carrera if preinsc else "",
            "posee_internet": preinsc.posee_internet if preinsc else "",
            "pueblo_originario": preinsc.pueblo_originario if preinsc else "",
            "posee_discapacidad": preinsc.posee_discapacidad if preinsc else "",
            "tipo_discapacidad": (preinsc.get_tipo_discapacidad_display() if preinsc.posee_discapacidad else "") if preinsc else "",
            "posee_cud": preinsc.posee_cud if preinsc else "",
            "observaciones": preinsc.observaciones if preinsc else "",
            "estado_preinscripcion": preinsc.estado if preinsc else "",
        })
        result.append(row)
    return result
