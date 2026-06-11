import logging
from typing import List, Optional
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Router, Schema
from ninja.errors import HttpError

from core.models import Estudiante, Inscripcion, Cohorte
from core.api.schemas import EstudianteDetailOut
from functools import wraps

logger = logging.getLogger(__name__)

router = Router(tags=["videojuegos"])

class VideojuegosPreinscripcionPatchIn(Schema):
    estado: str  # "aprobado" o "rechazado"

class VideojuegosConfigOut(Schema):
    abierta: bool
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None

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
    Devuelve si el formulario de inscripción está habilitado según las fechas de cohorte.
    """
    hoy = timezone.localdate()
    cohortes = Cohorte.objects.filter(programa__codigo="VJ").order_by("fecha_inicio")
    
    active_cohorte = None
    for c in cohortes:
        if c.fecha_inicio and c.fecha_fin:
            if c.fecha_inicio <= hoy <= c.fecha_fin:
                active_cohorte = c
                break
                
    if not active_cohorte:
        active_cohorte = cohortes.filter(fecha_inicio__gt=hoy).first() or cohortes.last()
        
    if not active_cohorte:
        return VideojuegosConfigOut(abierta=False)
        
    abierta = False
    if active_cohorte.fecha_inicio and active_cohorte.fecha_fin:
        abierta = active_cohorte.fecha_inicio <= hoy <= active_cohorte.fecha_fin
        
    return VideojuegosConfigOut(
        abierta=abierta,
        fecha_inicio=str(active_cohorte.fecha_inicio) if active_cohorte.fecha_inicio else None,
        fecha_fin=str(active_cohorte.fecha_fin) if active_cohorte.fecha_fin else None
    )
