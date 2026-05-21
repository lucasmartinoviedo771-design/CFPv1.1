from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth
from django.utils import timezone
from typing import Optional, List
from ..models import PreinscripcionTerciario
import threading
from django.core.mail import send_mail
from django.conf import settings

router = Router(tags=["preinscripcion-terciario"])


class PreinscripcionTerciarioIn(Schema):
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
    estudios_superiores_finalizado: Optional[bool] = None
    estudios_superiores_carrera: Optional[str] = ""
    posee_pc: bool
    posee_internet: bool
    pueblo_originario: bool = False
    posee_discapacidad: bool = False
    tipo_discapacidad: Optional[str] = ""
    posee_cud: Optional[bool] = None
    apoyo_inclusion: Optional[str] = ""
    requiere_apoyo_especifico: Optional[bool] = None
    descripcion_apoyo: Optional[str] = ""


class PreinscripcionTerciarioOut(Schema):
    id: int
    mensaje: str


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


@router.post("/preinscripcion-terciario", response=PreinscripcionTerciarioOut, auth=None)
def crear_preinscripcion_terciario(request, data: PreinscripcionTerciarioIn):
    if data.localidad == 'otras':
        raise HttpError(400, "La Tecnicatura es solo para residentes de Tierra del Fuego.")

    if PreinscripcionTerciario.objects.filter(dni=data.dni).exists():
        raise HttpError(400, "Ya existe una preinscripción registrada con ese DNI.")

    preinscripcion = PreinscripcionTerciario.objects.create(
        email=data.email,
        apellido_nombre=data.apellido_nombre,
        dni=data.dni,
        cuil=data.cuil,
        sexo=data.sexo,
        celular=data.celular,
        fecha_nacimiento=data.fecha_nacimiento,
        localidad_nacimiento=data.localidad_nacimiento,
        provincia_nacimiento=data.provincia_nacimiento,
        nacionalidad=data.nacionalidad,
        domicilio=data.domicilio,
        localidad=data.localidad,
        finalizo_secundaria=data.finalizo_secundaria,
        posee_estudios_superiores=data.posee_estudios_superiores,
        estudios_superiores_finalizado=data.estudios_superiores_finalizado,
        estudios_superiores_carrera=data.estudios_superiores_carrera or "",
        posee_pc=data.posee_pc,
        posee_internet=data.posee_internet,
        pueblo_originario=data.pueblo_originario,
        posee_discapacidad=data.posee_discapacidad,
        tipo_discapacidad=data.tipo_discapacidad or "",
        posee_cud=data.posee_cud,
        apoyo_inclusion=data.apoyo_inclusion or "",
        requiere_apoyo_especifico=data.requiere_apoyo_especifico,
        descripcion_apoyo=data.descripcion_apoyo or "",
    )

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
    estado: str
    observaciones: str
    created_at: str

    @staticmethod
    def resolve_created_at(obj):
        return obj.created_at.strftime("%Y-%m-%d %H:%M") if obj.created_at else ""


@router.get("/preinscripciones-terciario", response=List[PreinscripcionTerciarioListOut], auth=django_auth)
def listar_preinscripciones_terciario(request, estado: str = "", localidad: str = ""):
    if not request.user.is_staff:
        raise HttpError(403, "Sin permisos.")
    qs = PreinscripcionTerciario.objects.all().order_by("-created_at")
    if estado:
        qs = qs.filter(estado=estado)
    if localidad:
        qs = qs.filter(localidad=localidad)
    return list(qs)


@router.patch("/preinscripciones-terciario/{preinscripcion_id}", response=PreinscripcionTerciarioOut, auth=django_auth)
def actualizar_preinscripcion_terciario(request, preinscripcion_id: int, estado: str = "", observaciones: str = ""):
    if not request.user.is_staff:
        raise HttpError(403, "Sin permisos.")
    try:
        p = PreinscripcionTerciario.objects.get(id=preinscripcion_id)
    except PreinscripcionTerciario.DoesNotExist:
        raise HttpError(404, "No encontrada.")
    if estado:
        p.estado = estado
    if observaciones:
        p.observaciones = observaciones
    p.save()
    return {"id": p.id, "mensaje": "Actualizado correctamente."}
