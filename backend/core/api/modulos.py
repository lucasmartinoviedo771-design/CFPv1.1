from typing import List, Optional

from django.shortcuts import get_object_or_404
from ninja import Router

from core.models import Modulo
from core.serializers import ModuloSerializer
from .schemas import ModuloOut

router = Router(tags=["modulos"])


@router.get("", response=List[ModuloOut])
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
def crear_modulo(request, payload: dict):
    serializer = ModuloSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    m = serializer.save()
    return detalle_modulo(request, m.id)


@router.put("/{modulo_id}", response=ModuloOut)
@router.patch("/{modulo_id}", response=ModuloOut)
def actualizar_modulo(request, modulo_id: int, payload: dict):
    m = get_object_or_404(Modulo, pk=modulo_id)
    serializer = ModuloSerializer(instance=m, data=payload, partial=True)
    serializer.is_valid(raise_exception=True)
    m = serializer.save()
    return detalle_modulo(request, m.id)
