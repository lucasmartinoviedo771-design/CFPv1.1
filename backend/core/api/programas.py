from typing import List, Optional

from django.shortcuts import get_object_or_404
from ninja import Router

from core.models import Programa
from .schemas import ProgramaOut, ProgramaDetailOut, BloqueSimpleOut

router = Router(tags=["programas"])


@router.get("", response=List[ProgramaOut])
def listar_programas(request, activo: Optional[bool] = None):
    qs = Programa.objects.all().order_by("codigo")
    if activo is not None:
        qs = qs.filter(activo=activo)
    return qs


@router.get("/{programa_id}", response=ProgramaDetailOut)
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
