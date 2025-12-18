from typing import List, Optional

from django.shortcuts import get_object_or_404
from ninja import Router

from core.models import Cohorte, Inscripcion
from core.serializers import InscripcionSerializer
from .schemas import CohorteOut, InscripcionIn, CohorteIn
from core.api.permissions import require_authenticated_group

router = Router(tags=["inscripciones"])


# COHORTES - must be defined before /{inscripcion_id} to avoid routing conflict
@router.get("/cohortes", response=List[CohorteOut])
@require_authenticated_group
def listar_cohortes(request, programa_id: Optional[int] = None):
    qs = Cohorte.objects.select_related("programa", "bloque_fechas").order_by("-fecha_inicio")
    if programa_id:
        qs = qs.filter(programa_id=programa_id)
    return [
        CohorteOut(
            id=c.id,
            nombre=c.nombre,
            programa_id=c.programa_id,
            bloque_fechas_id=c.bloque_fechas_id,
        )
        for c in qs
    ]


# INSCRIPCIONES
@router.get("", response=List[dict])
@require_authenticated_group
def listar_inscripciones(request, cohorte_id: Optional[int] = None, estudiante_id: Optional[int] = None, estado: Optional[str] = None):
    qs = Inscripcion.objects.select_related("cohorte", "estudiante", "modulo", "modulo__bloque").order_by("-created_at")
    if cohorte_id:
        qs = qs.filter(cohorte_id=cohorte_id)
    if estudiante_id:
        qs = qs.filter(estudiante_id=estudiante_id)
    if estado:
        qs = qs.filter(estado=estado)
    return InscripcionSerializer(qs, many=True).data


@router.get("/{inscripcion_id}", response=dict)
@require_authenticated_group
def detalle_inscripcion(request, inscripcion_id: int):
    i = get_object_or_404(
        Inscripcion.objects.select_related("cohorte", "estudiante", "modulo", "modulo__bloque"),
        pk=inscripcion_id,
    )
    return InscripcionSerializer(i).data


@router.post("", response=dict)
@require_authenticated_group
def crear_inscripcion(request, payload: InscripcionIn):
    serializer = InscripcionSerializer(data=payload.dict())
    serializer.is_valid(raise_exception=True)
    insc = serializer.save()
    return detalle_inscripcion(request, insc.id)


@router.put("/{inscripcion_id}", response=dict)
@router.patch("/{inscripcion_id}", response=dict)
@require_authenticated_group
def actualizar_inscripcion(request, inscripcion_id: int, payload: InscripcionIn):
    insc = get_object_or_404(Inscripcion, pk=inscripcion_id)
    serializer = InscripcionSerializer(instance=insc, data=payload.dict(), partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return detalle_inscripcion(request, insc.id)


# Cohorte detail endpoints


@router.get("/cohortes/{cohorte_id}", response=CohorteOut)
@require_authenticated_group
def detalle_cohorte(request, cohorte_id: int):
    c = get_object_or_404(
        Cohorte.objects.select_related("programa", "bloque_fechas"),
        pk=cohorte_id,
    )
    return CohorteOut(
        id=c.id,
        nombre=c.nombre,
        programa_id=c.programa_id,
        bloque_fechas_id=c.bloque_fechas_id,
    )


@router.post("/cohortes", response=CohorteOut)
@require_authenticated_group
def crear_cohorte(request, payload: CohorteIn):
    cohorte = Cohorte.objects.create(
        nombre=payload.nombre,
        programa_id=payload.programa_id,
        bloque_fechas_id=payload.bloque_fechas_id,
    )
    return CohorteOut(
        id=cohorte.id,
        nombre=cohorte.nombre,
        programa_id=cohorte.programa_id,
        bloque_fechas_id=cohorte.bloque_fechas_id,
    )


@router.put("/cohortes/{cohorte_id}", response=CohorteOut)
@router.patch("/cohortes/{cohorte_id}", response=CohorteOut)
@require_authenticated_group
def actualizar_cohorte(request, cohorte_id: int, payload: CohorteIn):
    cohorte = get_object_or_404(Cohorte, pk=cohorte_id)
    cohorte.nombre = payload.nombre
    cohorte.programa_id = payload.programa_id
    cohorte.bloque_fechas_id = payload.bloque_fechas_id
    cohorte.save(update_fields=["nombre", "programa_id", "bloque_fechas_id"])
    return CohorteOut(
        id=cohorte.id,
        nombre=cohorte.nombre,
        programa_id=cohorte.programa_id,
        bloque_fechas_id=cohorte.bloque_fechas_id,
    )


@router.delete("/cohortes/{cohorte_id}", response=dict)
@require_authenticated_group
def eliminar_cohorte(request, cohorte_id: int):
    cohorte = get_object_or_404(Cohorte, pk=cohorte_id)
    cohorte.delete()
    return {"deleted": True, "id": cohorte_id}
