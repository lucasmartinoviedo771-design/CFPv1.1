from typing import List
from django.utils import timezone
from ninja import Router, Schema
from django.db import transaction
from core.models import Estudiante, Inscripcion
from core.api.permissions import require_authenticated_group
from core.services.email_service import enviar_correo_bienvenida
from .schemas import EstudianteDetailVJOut

router = Router(tags=["confirmar_bloques"])

class ConfirmarBloquesIn(Schema):
    inscripciones_ids: List[int]

@router.get("/pendientes", response=List[EstudianteDetailVJOut])
@require_authenticated_group
def listar_pendientes(request, panel: str = "cfp"):
    qs = Estudiante.objects.filter(
        inscripciones__estado=Inscripcion.PREINSCRIPTO,
        is_active=True
    ).distinct().prefetch_related(
        "inscripciones__cohorte__programa",
        "inscripciones__cohorte__bloque",
        "inscripciones__modulo__bloque",
    )
    
    if panel == "vj":
        qs = qs.filter(inscripciones__cohorte__programa__codigo="VJ")
    elif panel == "terciario":
        from core.models import PreinscripcionTerciario
        dni_terciarios = PreinscripcionTerciario.objects.values_list('dni', flat=True)
        qs = qs.filter(dni__in=dni_terciarios)
    else:  # cfp u otro, excluimos VJ y Terciario
        cfp_ins = Inscripcion.objects.filter(
            estado=Inscripcion.PREINSCRIPTO
        ).exclude(
            cohorte__programa__codigo="VJ"
        ).exclude(
            cohorte__programa_id=7
        )
        qs = qs.filter(inscripciones__in=cfp_ins)
        
    return list(qs.distinct())

@router.post("/confirmar-seleccion/", response=dict)
@require_authenticated_group
def confirmar_seleccion(request, payload: ConfirmarBloquesIn):
    with transaction.atomic():
        inscripciones = Inscripcion.objects.filter(
            id__in=payload.inscripciones_ids, 
            estado=Inscripcion.PREINSCRIPTO
        )
        
        estudiantes_ids = set(inscripciones.values_list('estudiante_id', flat=True))
        
        updated_inscripciones = inscripciones.update(estado=Inscripcion.CURSANDO, updated_at=timezone.now())
        
        estudiantes = Estudiante.objects.filter(id__in=estudiantes_ids, estatus="Preinscripto")
        updated_estudiantes = 0
        for est in estudiantes:
            est.estatus = "Regular"
            est.updated_at = timezone.now()
            est.save(update_fields=['estatus', 'updated_at'])
            enviar_correo_bienvenida(est.id)
            updated_estudiantes += 1
            
    return {
        "inscripciones_confirmadas": updated_inscripciones, 
        "estudiantes_regularizados": updated_estudiantes
    }
