from ninja import Router, Schema
from ninja.errors import HttpError
from django.utils import timezone
from django.db import transaction
from typing import Optional, List
from ..models import PreinscripcionTerciario, Inscripcion, Modulo, Cohorte, Estudiante
import threading
from django.core.mail import send_mail
from django.conf import settings

router = Router(tags=["preinscripcion-terciario"])

MODULO_HD2_ID = 19  # Módulo 2 Habilidades Digitales
HD_COHORTE_TERCIARIO_NOMBRE = "Terciario 2026"


def _get_or_create_cohorte_terciario():
    cohorte, _ = Cohorte.objects.get_or_create(nombre=HD_COHORTE_TERCIARIO_NOMBRE)
    return cohorte


def _inscribir_hd(preinscripcion: PreinscripcionTerciario):
    try:
        mod2 = Modulo.objects.get(id=MODULO_HD2_ID)
        cohorte = _get_or_create_cohorte_terciario()

        # Buscar o crear estudiante por DNI
        estudiante = Estudiante.objects.filter(dni=preinscripcion.dni).first()
        if not estudiante:
            partes = preinscripcion.apellido_nombre.split(" ", 1)
            apellido = partes[0] if partes else preinscripcion.apellido_nombre
            nombre = partes[1] if len(partes) > 1 else ""
            estudiante = Estudiante.objects.create(
                dni=preinscripcion.dni,
                apellido=apellido,
                nombre=nombre,
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
        send_mail(
            subject="Confirmación de Preinscripción - Tecnicatura en Ciencias de Datos e IA",
            message=f"""Estimado/a {preinscripcion.apellido_nombre},

Tu preinscripción a la Tecnicatura en Ciencias de Datos e Inteligencia Artificial
del Centro Politécnico Superior Malvinas Argentinas fue recibida correctamente.

DNI: {preinscripcion.dni}
Email registrado: {preinscripcion.email}

En los próximos días recibirás información sobre los pasos a seguir.

Centro Politécnico Superior Malvinas Argentinas
tecnicaturedatos@tdf.edu.ar
""",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[preinscripcion.email],
            fail_silently=True,
        )
    except Exception:
        pass


@router.post("/preinscripcion-terciario", auth=None)
def crear_preinscripcion_terciario(request):
    """Acepta multipart/form-data con archivos opcionales."""
    data = request.POST
    files = request.FILES

    localidad = data.get("localidad", "")
    if localidad == "otras":
        raise HttpError(400, "La Tecnicatura es solo para residentes de Tierra del Fuego.")

    dni = data.get("dni", "").strip()
    if not dni:
        raise HttpError(400, "El DNI es obligatorio.")

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

    try:
        preinscripcion = PreinscripcionTerciario.objects.create(
            email=data.get("email", "").strip(),
            apellido_nombre=data.get("apellido_nombre", "").strip(),
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
    except Exception as e:
        raise HttpError(400, f"Error al guardar: {str(e)}")

    threading.Thread(target=_enviar_confirmacion, args=(preinscripcion,)).start()

    return {"id": preinscripcion.id, "mensaje": "Preinscripción registrada correctamente."}


class PreinscripcionTerciarioListOut(Schema):
    id: int
    email: str
    apellido_nombre: str
    dni: str
    cuil: str
    sexo: str
    celular: str
    fecha_nacimiento: str
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
    estado: str
    observaciones: str
    created_at: str
    hd_estado: Optional[str]

    @staticmethod
    def resolve_created_at(obj):
        return obj.created_at.strftime("%Y-%m-%d %H:%M") if obj.created_at else ""

    @staticmethod
    def resolve_tiene_dni(obj):
        return bool(obj.dni_digitalizado)

    @staticmethod
    def resolve_tiene_titulo(obj):
        return bool(obj.titulo_digitalizado)

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
    if not (request.user.is_staff or request.user.groups.filter(name__in=["Admin", "Terciario"]).exists()):
        raise HttpError(403, "Sin permisos.")
    qs = PreinscripcionTerciario.objects.select_related("hd_inscripcion").all().order_by("-created_at")
    if estado:
        qs = qs.filter(estado=estado)
    if localidad:
        qs = qs.filter(localidad=localidad)
    return list(qs)


@router.patch("/preinscripciones-terciario/{preinscripcion_id}")
def actualizar_preinscripcion_terciario(
    request, preinscripcion_id: int, estado: str = "", observaciones: str = ""
):
    if not (request.user.is_staff or request.user.groups.filter(name__in=["Admin", "Terciario"]).exists()):
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


@router.get("/preinscripciones-terciario-stats")
def stats_preinscripciones_terciario(request):
    if not (request.user.is_staff or request.user.groups.filter(name__in=["Admin", "Terciario"]).exists()):
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
