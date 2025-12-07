from typing import List, Optional

from django.shortcuts import get_object_or_404
from ninja import Router

from core.models import Bloque
from .schemas import BloqueOut, BloqueDetailOut, ModuloOut

router = Router(tags=["bloques"])


@router.get("", response=List[BloqueOut])
def listar_bloques(request, programa_id: Optional[int] = None):
    qs = Bloque.objects.all().order_by("programa_id", "orden", "id").prefetch_related("correlativas")
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
                orden=b.orden,
                correlativas_ids=correlativas_ids,
            )
        )
    return bloques


@router.get("/{bloque_id}", response=BloqueDetailOut)
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
            orden=m.orden,
            fecha_inicio=m.fecha_inicio,
            fecha_fin=m.fecha_fin,
            es_practica=m.es_practica,
            asistencia_requerida_practica=m.asistencia_requerida_practica,
        )
        for m in sorted(bloque.modulos.all(), key=lambda x: (x.orden, x.id))
    ]
    return BloqueDetailOut(
        id=bloque.id,
        programa_id=bloque.programa_id,
        nombre=bloque.nombre,
        orden=bloque.orden,
        correlativas_ids=correlativas_ids,
        modulos=modulos,
    )
