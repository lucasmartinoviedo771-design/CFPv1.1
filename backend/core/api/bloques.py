from typing import List, Optional

from django.shortcuts import get_object_or_404
from ninja import Router
from core.api.permissions import require_authenticated_group

from core.models import Bloque
from core.serializers import BloqueSerializer
from .schemas import BloqueOut, BloqueDetailOut, ModuloOut, BloqueIn

router = Router(tags=["bloques"])


@router.get("", response=List[BloqueOut])
@require_authenticated_group
def listar_bloques(request, programa_id: Optional[int] = None):
    qs = Bloque.objects.all().order_by("id").prefetch_related("correlativas")
    if programa_id:
        qs = qs.filter(programa_id=programa_id)
    bloques = []
    for b in qs:
        correlativas_ids = list(b.correlativas.values_list("id", flat=True))
        bloques.append(
            BloqueOut(
                id=b.id,
                programa_id=b.programa_id,
                nombre=b.nombre,
                correlativas_ids=correlativas_ids,
            )
        )
    return bloques


@router.get("/{bloque_id}", response=BloqueDetailOut)
@require_authenticated_group
def detalle_bloque(request, bloque_id: int):
    bloque = get_object_or_404(
        Bloque.objects.select_related("programa").prefetch_related("modulos", "correlativas"),
        pk=bloque_id,
    )
    correlativas_ids = list(bloque.correlativas.values_list("id", flat=True))
    modulos = [
        ModuloOut(
            id=m.id,
            bloque_id=m.bloque_id,
            nombre=m.nombre,
            fecha_inicio=m.fecha_inicio,
            fecha_fin=m.fecha_fin,
            es_practica=m.es_practica,
            asistencia_requerida_practica=m.asistencia_requerida_practica,
        )
        for m in sorted(bloque.modulos.all(), key=lambda x: x.id)
    ]
    return BloqueDetailOut(
        id=bloque.id,
        programa_id=bloque.programa_id,
        nombre=bloque.nombre,
        correlativas_ids=correlativas_ids,
        modulos=modulos,
    )


@router.post("", response=BloqueDetailOut)
@require_authenticated_group
def crear_bloque(request, payload: BloqueIn):
    serializer = BloqueSerializer(data=payload.dict())
    serializer.is_valid(raise_exception=True)
    bloque = serializer.save()
    return detalle_bloque(request, bloque.id)


@router.put("/{bloque_id}", response=BloqueDetailOut)
@router.patch("/{bloque_id}", response=BloqueDetailOut)
@require_authenticated_group
def actualizar_bloque(request, bloque_id: int, payload: BloqueIn):
    bloque = get_object_or_404(Bloque, pk=bloque_id)
    serializer = BloqueSerializer(instance=bloque, data=payload.dict(), partial=True)
    serializer.is_valid(raise_exception=True)
    bloque = serializer.save()
    return detalle_bloque(request, bloque.id)


@router.delete("/{bloque_id}", response=dict)
@require_authenticated_group
def eliminar_bloque(request, bloque_id: int):
    bloque = get_object_or_404(Bloque, pk=bloque_id)
    bloque.delete()
    return {"deleted": True, "id": bloque_id}
