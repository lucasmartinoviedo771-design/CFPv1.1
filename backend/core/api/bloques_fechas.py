from typing import List
from django.db import transaction
from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from core.api.permissions import require_authenticated_group

from core.models import BloqueDeFechas, SemanaConfig
from core.serializers import BloqueDeFechasSerializer, SemanaConfigSerializer

router = Router(tags=["bloques-de-fechas"])


class SemanaInput(Schema):
    tipo: str


class SecuenciaPayload(Schema):
    semanas: List[SemanaInput]


@router.get("", response=List[dict])
@require_authenticated_group
def listar_bloques_fechas(request):
    qs = BloqueDeFechas.objects.prefetch_related("semanas_config").order_by("nombre")
    return BloqueDeFechasSerializer(qs, many=True).data


@router.get("/{bloque_id}", response=dict)
@require_authenticated_group
def detalle_bloque_fechas(request, bloque_id: int):
    bloque = get_object_or_404(BloqueDeFechas.objects.prefetch_related("semanas_config"), pk=bloque_id)
    return BloqueDeFechasSerializer(bloque).data


@router.post("", response=dict)
@require_authenticated_group
def crear_bloque_fechas(request, payload: dict):
    serializer = BloqueDeFechasSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    bloque = serializer.save()
    return detalle_bloque_fechas(request, bloque.id)


@router.put("/{bloque_id}", response=dict)
@router.patch("/{bloque_id}", response=dict)
@require_authenticated_group
def actualizar_bloque_fechas(request, bloque_id: int, payload: dict):
    bloque = get_object_or_404(BloqueDeFechas, pk=bloque_id)
    serializer = BloqueDeFechasSerializer(instance=bloque, data=payload, partial=True)
    serializer.is_valid(raise_exception=True)
    bloque = serializer.save()
    return detalle_bloque_fechas(request, bloque.id)


@router.delete("/{bloque_id}", response=dict)
@require_authenticated_group
def eliminar_bloque_fechas(request, bloque_id: int):
    bloque = get_object_or_404(BloqueDeFechas, pk=bloque_id)
    bloque.delete()
    return {"deleted": True, "id": bloque_id}


@router.post("/{bloque_id}/guardar_secuencia", response=dict)
@require_authenticated_group
def guardar_secuencia(request, bloque_id: int, payload: SecuenciaPayload):
    """
    Reemplaza la secuencia de semanas para un bloque de fechas.
    Espera payload {"semanas": [{"tipo": "CLASE"}, ...]} respetando el orden enviado.
    """
    bloque = get_object_or_404(BloqueDeFechas, pk=bloque_id)
    semanas_data = payload.semanas

    with transaction.atomic():
        bloque.semanas_config.all().delete()
        for idx, semana in enumerate(semanas_data):
            SemanaConfig.objects.create(
                bloque=bloque,
                orden=idx + 1,
                tipo=semana.tipo,
            )

    return {"status": "ok", "bloque_id": bloque_id, "semanas": SemanaConfigSerializer(bloque.semanas_config.all(), many=True).data}
