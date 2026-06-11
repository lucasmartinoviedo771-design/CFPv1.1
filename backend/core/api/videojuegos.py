import logging
from typing import List, Optional
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from ninja import Router, Schema
from ninja.errors import HttpError

from core.models import Estudiante, Inscripcion, ConfiguracionPreinscripcionVideojuegos
from core.api.schemas import EstudianteDetailOut, EstudianteListOut, EstudianteIn
from functools import wraps

logger = logging.getLogger(__name__)

router = Router(tags=["videojuegos"])

class VideojuegosPreinscripcionPatchIn(Schema):
    estado: str  # "aprobado" o "rechazado"

class VideojuegosConfigOut(Schema):
    abierta: bool
    preinscripcion_abierta: bool
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    mensaje_cierre: Optional[str] = None
    cohorte_activa_id: Optional[int] = None

class VideojuegosConfigPatchIn(Schema):
    preinscripcion_abierta: Optional[bool] = None
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    mensaje_cierre: Optional[str] = None
    cohorte_activa_id: Optional[int] = None

class VideojuegosEstudianteOut(EstudianteDetailOut):
    estado_vj: str  # "pendiente", "aprobado", "rechazado"
    bloques_vj: List[str] = []

    @staticmethod
    def resolve_estado_vj(obj):
        vj_ins = [i for i in obj.inscripciones.all() if i.cohorte.programa.codigo == "VJ"]
        if not vj_ins:
            return "pendiente"
        if any(i.estado in ["CURSANDO", "APROBADO", "EGRESADO"] for i in vj_ins):
            return "aprobado"
        if all(i.estado in ["INACTIVO", "DESAPROBADO", "LIBRE"] for i in vj_ins):
            return "rechazado"
        return "pendiente"

    @staticmethod
    def resolve_bloques_vj(obj):
        vj_ins = [i for i in obj.inscripciones.all() if i.cohorte.programa.codigo == "VJ"]
        bloques = set()
        for i in vj_ins:
            bloque_obj = i.modulo.bloque if (i.modulo and i.modulo.bloque) else (i.cohorte.bloque if i.cohorte else None)
            if bloque_obj:
                bloques.add(bloque_obj.nombre)
        return sorted(list(bloques))

def _tiene_acceso_videojuegos(user):
    if user.is_superuser:
        return True
    return user.groups.filter(name__in=["Admin", "Secretaría", "Regencia", "Videojuegos"]).exists()

def require_videojuegos_access(func):
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        if not request.user or not request.user.is_authenticated:
            raise HttpError(401, "Authentication credentials were not provided.")
        if not _tiene_acceso_videojuegos(request.user):
            raise HttpError(403, "You do not have permission to perform this action.")
        return func(request, *args, **kwargs)
    return wrapper

@router.get("/preinscripciones", response=List[VideojuegosEstudianteOut])
@require_videojuegos_access
def listar_preinscripciones_videojuegos(request):
    """
    Lista todos los estudiantes registrados que tengan inscripciones en el programa VJ.
    """
    qs = Estudiante.objects.filter(
        is_active=True,
        inscripciones__cohorte__programa__codigo="VJ"
    ).distinct().select_related("nivelacion_digital").prefetch_related(
        "inscripciones__cohorte__programa",
        "inscripciones__cohorte__bloque",
        "inscripciones__modulo__bloque",
    ).order_by("apellido", "nombre")
    
    return list(qs)

@router.patch("/preinscripciones/{estudiante_id}", response=VideojuegosEstudianteOut)
@require_videojuegos_access
def actualizar_preinscripcion_videojuegos(
    request,
    estudiante_id: int,
    payload: VideojuegosPreinscripcionPatchIn
):
    """
    Aprueba o rechaza la preinscripción del estudiante en el programa Videojuegos (VJ).
    """
    estudiante = get_object_or_404(
        Estudiante,
        pk=estudiante_id
    )
    if not estudiante.inscripciones.filter(cohorte__programa__codigo="VJ").exists():
        raise HttpError(404, "No se encontró el estudiante para el programa de Videojuegos.")
    
    estado = payload.estado.lower().strip()
    if estado not in ["aprobado", "rechazado"]:
        raise HttpError(400, "Estado inválido. Opciones: aprobado, rechazado.")
        
    with transaction.atomic():
        if estado == "aprobado":
            # Cambiar estatus general del estudiante a Regular si estaba como preinscripto
            if estudiante.estatus == "Preinscripto":
                estudiante.estatus = "Regular"
                estudiante.save(update_fields=["estatus", "updated_at"])
                
            # Cambiar inscripciones de VJ de PREINSCRIPTO a CURSANDO
            Inscripcion.objects.filter(
                estudiante=estudiante,
                cohorte__programa__codigo="VJ",
                estado=Inscripcion.PREINSCRIPTO
            ).update(
                estado=Inscripcion.CURSANDO,
                updated_at=timezone.now()
            )
            
            # Disparar correo de bienvenida del campus
            try:
                from core.services.email_service import enviar_correo_bienvenida
                enviar_correo_bienvenida(estudiante.id)
            except Exception as e:
                logger.error(f"Error al enviar correo de bienvenida de Moodle: {e}")
                
        elif estado == "rechazado":
            # Cambiar inscripciones de VJ a INACTIVO
            Inscripcion.objects.filter(
                estudiante=estudiante,
                cohorte__programa__codigo="VJ"
            ).update(
                estado=Inscripcion.INACTIVO,
                updated_at=timezone.now()
            )
            
            # Si el estudiante no tiene ningún otro trayecto activo, marcar como Baja
            has_other_active = Inscripcion.objects.filter(
                estudiante=estudiante
            ).exclude(
                cohorte__programa__codigo="VJ"
            ).exclude(
                estado__in=[Inscripcion.INACTIVO, Inscripcion.DESAPROBADO, Inscripcion.LIBRE]
            ).exists()
            
            if not has_other_active:
                estudiante.estatus = "Baja"
                estudiante.save(update_fields=["estatus", "updated_at"])

    # Recargar y devolver
    estudiante = Estudiante.objects.select_related("nivelacion_digital").prefetch_related(
        "inscripciones__cohorte__programa",
        "inscripciones__cohorte__bloque",
        "inscripciones__modulo__bloque",
    ).get(pk=estudiante_id)
    
    return estudiante

@router.get("/config", response=VideojuegosConfigOut, auth=None)
def get_videojuegos_config(request):
    """
    Devuelve si el formulario de inscripción está habilitado según la configuración manual.
    """
    cfg = ConfiguracionPreinscripcionVideojuegos.get()
    abierta = cfg.preinscripcion_abierta
    hoy = timezone.localdate()
    if abierta and cfg.fecha_inicio and hoy < cfg.fecha_inicio:
        abierta = False
    if abierta and cfg.fecha_fin and hoy > cfg.fecha_fin:
        abierta = False
        
    return VideojuegosConfigOut(
        abierta=abierta,
        preinscripcion_abierta=cfg.preinscripcion_abierta,
        fecha_inicio=str(cfg.fecha_inicio) if cfg.fecha_inicio else None,
        fecha_fin=str(cfg.fecha_fin) if cfg.fecha_fin else None,
        mensaje_cierre=cfg.mensaje_cierre,
        cohorte_activa_id=cfg.cohorte_activa_id
    )

@router.patch("/config", response=VideojuegosConfigOut)
@require_videojuegos_access
def actualizar_videojuegos_config(request, payload: VideojuegosConfigPatchIn):
    """
    Actualiza la configuración de preinscripción de videojuegos.
    """
    cfg = ConfiguracionPreinscripcionVideojuegos.get()
    data = payload.dict(exclude_none=True)
    
    update_fields = []
    if "preinscripcion_abierta" in data:
        cfg.preinscripcion_abierta = data["preinscripcion_abierta"]
        update_fields.append("preinscripcion_abierta")
        
    if "fecha_inicio" in data:
        fi = data["fecha_inicio"]
        cfg.fecha_inicio = timezone.datetime.strptime(fi, "%Y-%m-%d").date() if (fi and fi != "") else None
        update_fields.append("fecha_inicio")
        
    if "fecha_fin" in data:
        ff = data["fecha_fin"]
        cfg.fecha_fin = timezone.datetime.strptime(ff, "%Y-%m-%d").date() if (ff and ff != "") else None
        update_fields.append("fecha_fin")
        
    if "mensaje_cierre" in data:
        cfg.mensaje_cierre = data["mensaje_cierre"]
        update_fields.append("mensaje_cierre")
        
    if "cohorte_activa_id" in data:
        cfg.cohorte_activa_id = data["cohorte_activa_id"] if data["cohorte_activa_id"] > 0 else None
        update_fields.append("cohorte_activa_id")
        
    if update_fields:
        cfg.save(update_fields=update_fields)
        cfg.refresh_from_db()
        
    # Calcular abierta
    abierta = cfg.preinscripcion_abierta
    hoy = timezone.localdate()
    if abierta and cfg.fecha_inicio and hoy < cfg.fecha_inicio:
        abierta = False
    if abierta and cfg.fecha_fin and hoy > cfg.fecha_fin:
        abierta = False
        
    return VideojuegosConfigOut(
        abierta=abierta,
        preinscripcion_abierta=cfg.preinscripcion_abierta,
        fecha_inicio=str(cfg.fecha_inicio) if cfg.fecha_inicio else None,
        fecha_fin=str(cfg.fecha_fin) if cfg.fecha_fin else None,
        mensaje_cierre=cfg.mensaje_cierre,
        cohorte_activa_id=cfg.cohorte_activa_id
    )


# -------------------------------------------------------------
# Endpoints de Alumnos (Estudiantes) para Videojuegos (VJ)
# -------------------------------------------------------------

@router.get("/alumnos", response=List[EstudianteListOut])
@require_videojuegos_access
def listar_alumnos_videojuegos(
    request,
    search: Optional[str] = None,
    dni: Optional[str] = None,
    estatus: Optional[str] = None,
    cohorte_id: Optional[int] = None,
    rango_edad: Optional[str] = None,
):
    """
    Lista todos los estudiantes que tengan inscripciones en el programa de Videojuegos (VJ).
    """
    qs = Estudiante.objects.filter(
        is_active=True,
        inscripciones__cohorte__programa__codigo="VJ"
    ).distinct().select_related("nivelacion_digital").prefetch_related(
        "inscripciones__cohorte__programa",
        "inscripciones__cohorte__bloque",
        "inscripciones__modulo__bloque",
    ).order_by("apellido", "nombre")

    if dni:
        qs = qs.filter(dni__iexact=dni)
    if estatus:
        qs = qs.filter(estatus=estatus)
    if search:
        qs = qs.filter(
            Q(apellido__icontains=search)
            | Q(nombre__icontains=search)
            | Q(email__icontains=search)
            | Q(dni__icontains=search)
            | Q(telefono__icontains=search)
        )
    if cohorte_id:
        qs = qs.filter(inscripciones__cohorte_id=cohorte_id).distinct()

    if rango_edad:
        today = timezone.localdate()
        date_18 = today.replace(year=today.year - 18)
        if rango_edad == "menores":
            qs = qs.filter(fecha_nacimiento__gt=date_18)
        elif rango_edad == "mayores":
            qs = qs.filter(fecha_nacimiento__lte=date_18)

    return list(qs)


@router.get("/alumnos/{estudiante_id}", response=EstudianteDetailOut)
@require_videojuegos_access
def obtener_alumno_videojuegos(request, estudiante_id: int):
    """
    Devuelve los detalles de un estudiante de Videojuegos.
    """
    estudiante = get_object_or_404(
        Estudiante,
        pk=estudiante_id,
        inscripciones__cohorte__programa__codigo="VJ"
    )
    return estudiante


@router.patch("/alumnos/{estudiante_id}", response=EstudianteDetailOut)
@require_videojuegos_access
def actualizar_alumno_videojuegos(request, estudiante_id: int, payload: EstudianteIn):
    """
    Actualiza la información de un estudiante de Videojuegos.
    """
    estudiante = get_object_or_404(
        Estudiante,
        pk=estudiante_id,
        inscripciones__cohorte__programa__codigo="VJ"
    )
    
    data = payload.dict(exclude_none=True)
    update_fields = []
    
    # Lista de campos editables en Estudiante
    editable_fields = [
        "apellido", "nombre", "dni", "cuit", "sexo", "fecha_nacimiento",
        "nacionalidad", "lugar_nacimiento", "domicilio", "barrio", "ciudad",
        "telefono", "email", "nivel_educativo", "posee_pc", "posee_conectividad",
        "trabaja", "lugar_trabajo", "estatus"
    ]
    
    for f in editable_fields:
        if f in data:
            setattr(estudiante, f, data[f])
            if f not in update_fields:
                update_fields.append(f)
                
    if update_fields:
        estudiante.updated_at = timezone.now()
        update_fields.append("updated_at")
        estudiante.save(update_fields=update_fields)
        
    return estudiante
