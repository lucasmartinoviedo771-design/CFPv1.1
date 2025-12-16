from typing import List, Optional

from django.shortcuts import get_object_or_404
from ninja import Router
from core.api.permissions import require_authenticated_group

from core.models import Programa
from core.serializers import ProgramaSerializer
from .schemas import ProgramaOut, ProgramaDetailOut, BloqueSimpleOut, ProgramaIn

router = Router(tags=["programas"])


@router.get("", response=List[ProgramaOut])
@require_authenticated_group
def listar_programas(request, activo: Optional[bool] = None):
    qs = Programa.objects.all().order_by("codigo")
    if activo is not None:
        qs = qs.filter(activo=activo)
    return qs


@router.get("/{programa_id}", response=ProgramaDetailOut)
@require_authenticated_group
def detalle_programa(request, programa_id: int):
    programa = get_object_or_404(
        Programa.objects.prefetch_related("bloques"),
        pk=programa_id,
    )
    bloques = [
        BloqueSimpleOut(id=b.id, nombre=b.nombre, orden=b.orden)
        for b in sorted(programa.bloques.all(), key=lambda x: (x.orden, x.id))
    ]
    return ProgramaDetailOut(
        id=programa.id,
        codigo=programa.codigo,
        nombre=programa.nombre,
        activo=programa.activo,
        bloques=bloques,
    )


@router.post("", response=ProgramaDetailOut)
@require_authenticated_group
def crear_programa(request, payload: ProgramaIn):
    serializer = ProgramaSerializer(data=payload.dict())
    serializer.is_valid(raise_exception=True)
    programa = serializer.save()
    return detalle_programa(request, programa.id)


@router.put("/{programa_id}", response=ProgramaDetailOut)
@router.patch("/{programa_id}", response=ProgramaDetailOut)
@require_authenticated_group
def actualizar_programa(request, programa_id: int, payload: ProgramaIn):
    programa = get_object_or_404(Programa, pk=programa_id)
    serializer = ProgramaSerializer(instance=programa, data=payload.dict(), partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return detalle_programa(request, programa.id)


@router.delete("/{programa_id}", response=dict)
@require_authenticated_group
def eliminar_programa(request, programa_id: int):
    programa = get_object_or_404(Programa, pk=programa_id)
    programa.delete()
    return {"deleted": True, "id": programa_id}
