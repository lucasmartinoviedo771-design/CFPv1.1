from typing import List, Optional

from django.shortcuts import get_object_or_404
from ninja import Router
from core.api.permissions import require_authenticated_group

from core.models import Modulo
from core.serializers import ModuloSerializer
from .schemas import ModuloOut, ModuloIn

router = Router(tags=["modulos"])


@router.get("", response=List[ModuloOut])
@require_authenticated_group
def listar_modulos(request, bloque_id: Optional[int] = None, es_practica: Optional[bool] = None):
    qs = Modulo.objects.select_related("bloque").order_by("bloque_id", "orden", "id")
    if bloque_id:
        qs = qs.filter(bloque_id=bloque_id)
    if es_practica is not None:
        qs = qs.filter(es_practica=es_practica)
    return [
        ModuloOut(
            id=m.id,
            bloque_id=m.bloque_id,
            nombre=m.nombre,
            orden=m.orden,
            fecha_inicio=m.fecha_inicio,
            fecha_fin=m.fecha_fin,
            es_practica=m.es_practica,
            asistencia_requerida_practica=m.asistencia_requerida_practica,
        )
        for m in qs
    ]


@router.get("/{modulo_id}", response=ModuloOut)
@require_authenticated_group
def detalle_modulo(request, modulo_id: int):
    m = get_object_or_404(Modulo.objects.select_related("bloque"), pk=modulo_id)
    return ModuloOut(
        id=m.id,
        bloque_id=m.bloque_id,
        nombre=m.nombre,
        orden=m.orden,
        fecha_inicio=m.fecha_inicio,
        fecha_fin=m.fecha_fin,
        es_practica=m.es_practica,
        asistencia_requerida_practica=m.asistencia_requerida_practica,
    )


@router.post("", response=ModuloOut)
@require_authenticated_group
def crear_modulo(request, payload: ModuloIn):
    serializer = ModuloSerializer(data=payload.dict(exclude_none=True))
    serializer.is_valid(raise_exception=True)
    m = serializer.save()
    return detalle_modulo(request, m.id)


@router.put("/{modulo_id}", response=ModuloOut)
@router.patch("/{modulo_id}", response=ModuloOut)
@require_authenticated_group
def actualizar_modulo(request, modulo_id: int, payload: ModuloIn):
    m = get_object_or_404(Modulo, pk=modulo_id)
    serializer = ModuloSerializer(instance=m, data=payload.dict(exclude_none=True), partial=True)
    serializer.is_valid(raise_exception=True)
    m = serializer.save()
    return detalle_modulo(request, m.id)
