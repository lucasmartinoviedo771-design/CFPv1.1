# backend/core/api/resoluciones.py
"""
API endpoints para gestión de Resoluciones (Marco legal de capacitaciones)
"""
from typing import List, Optional
from django.shortcuts import get_object_or_404
from ninja import Router
from core.api.permissions import require_authenticated_group

from core.models import Resolucion
from core.serializers import ResolucionSerializer
from .schemas import ResolucionOut, ResolucionIn, ResolucionStructureOut

router = Router(tags=["resoluciones"])


@router.get("", response=List[ResolucionOut])
@require_authenticated_group
def listar_resoluciones(request, vigente: Optional[bool] = None):
    """Lista todas las resoluciones, con filtro opcional por vigencia"""
    qs = Resolucion.objects.all().order_by("-fecha_publicacion")
    if vigente is not None:
        qs = qs.filter(vigente=vigente)
    return qs


@router.get("/estructura_completa", response=List[ResolucionStructureOut])
@require_authenticated_group
def estructura_completa(request):
    """
    Retorna toda la estructura académica (Resoluciones -> Programas -> Bloques -> Módulos)
    de forma optimizada en una sola solicitud.
    """
    resoluciones = Resolucion.objects.all().prefetch_related(
        "programas",
        "programas__bloques",
        "programas__bloques__modulos"
    ).order_by("-fecha_publicacion")
    return resoluciones


@router.get("/{resolucion_id}", response=ResolucionOut)
@require_authenticated_group
def detalle_resolucion(request, resolucion_id: int):
    """Obtiene el detalle de una resolución específica"""
    resolucion = get_object_or_404(Resolucion, pk=resolucion_id)
    return resolucion


@router.post("", response=ResolucionOut)
@require_authenticated_group
def crear_resolucion(request, payload: ResolucionIn):
    """Crea una nueva resolución"""
    serializer = ResolucionSerializer(data=payload.dict())
    serializer.is_valid(raise_exception=True)
    resolucion = serializer.save()
    return resolucion


@router.put("/{resolucion_id}", response=ResolucionOut)
@router.patch("/{resolucion_id}", response=ResolucionOut)
@require_authenticated_group
def actualizar_resolucion(request, resolucion_id: int, payload: ResolucionIn):
    """Actualiza una resolución existente"""
    resolucion = get_object_or_404(Resolucion, pk=resolucion_id)
    serializer = ResolucionSerializer(instance=resolucion, data=payload.dict(), partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return resolucion


@router.delete("/{resolucion_id}", response=dict)
@require_authenticated_group
def eliminar_resolucion(request, resolucion_id: int):
    """Elimina una resolución (solo si no tiene programas asociados)"""
    resolucion = get_object_or_404(Resolucion, pk=resolucion_id)
    
    # Verificar si tiene programas asociados
    if resolucion.programas.exists():
        return {
            "error": "No se puede eliminar la resolución porque tiene programas asociados",
            "programas_count": resolucion.programas.count()
        }, 400
    
    resolucion.delete()
    return {"deleted": True, "id": resolucion_id}
