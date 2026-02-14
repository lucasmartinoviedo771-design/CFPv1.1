import json
from typing import List, Optional

from django.shortcuts import get_object_or_404
from ninja.errors import HttpError
from ninja import Router
from core.api.permissions import require_authenticated_group

from core.models import Modulo
from core.serializers import ModuloSerializer
from .schemas import ModuloOut, ModuloIn

router = Router(tags=["modulos"])


def _rechazar_fechas_en_payload(request) -> None:
    """
    Fase 2: las fechas ya no se cargan a nivel módulo (solo cohorte/calendario).
    Rechaza explícitamente payloads con fecha_inicio/fecha_fin para blindar API.
    """
    try:
        raw = request.body.decode("utf-8") if request.body else ""
        payload = json.loads(raw) if raw else {}
    except Exception:
        payload = {}

    campos_prohibidos = {"fecha_inicio", "fecha_fin"} & set(payload.keys())
    if campos_prohibidos:
        raise HttpError(
            400,
            f"Los campos {sorted(campos_prohibidos)} no se permiten en módulos. "
            "Las fechas se gestionan en Cohortes/Calendario.",
        )


@router.get("", response=List[ModuloOut])
@require_authenticated_group
def listar_modulos(request, bloque_id: Optional[int] = None):
    qs = Modulo.objects.select_related("bloque").order_by("id")
    if bloque_id:
        qs = qs.filter(bloque_id=bloque_id)
    return [
        ModuloOut(
            id=m.id,
            bloque_id=m.bloque_id,
            nombre=m.nombre,
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
        fecha_inicio=m.fecha_inicio,
        fecha_fin=m.fecha_fin,
        es_practica=m.es_practica,
        asistencia_requerida_practica=m.asistencia_requerida_practica,
    )


@router.post("", response=ModuloOut)
@require_authenticated_group
def crear_modulo(request, payload: ModuloIn):
    _rechazar_fechas_en_payload(request)
    serializer = ModuloSerializer(data=payload.dict(exclude_none=True))
    serializer.is_valid(raise_exception=True)
    m = serializer.save()
    return detalle_modulo(request, m.id)


@router.put("/{modulo_id}", response=ModuloOut)
@router.patch("/{modulo_id}", response=ModuloOut)
@require_authenticated_group
def actualizar_modulo(request, modulo_id: int, payload: ModuloIn):
    _rechazar_fechas_en_payload(request)
    m = get_object_or_404(Modulo, pk=modulo_id)
    serializer = ModuloSerializer(instance=m, data=payload.dict(exclude_none=True), partial=True)
    serializer.is_valid(raise_exception=True)
    m = serializer.save()
    return detalle_modulo(request, m.id)


@router.delete("/{modulo_id}", response=dict)
@require_authenticated_group
def eliminar_modulo(request, modulo_id: int):
    m = get_object_or_404(Modulo, pk=modulo_id)
    m.delete()
    return {"deleted": True, "id": modulo_id}
