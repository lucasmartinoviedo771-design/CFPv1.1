from datetime import timedelta
from typing import List, Optional

from django.shortcuts import get_object_or_404
from django.http import HttpRequest
from django.utils import timezone
from ninja import Router

from core.models import Cohorte, Inscripcion, SemanaConfig, Bloque
from core.serializers import InscripcionSerializer
from .schemas import CohorteOut, InscripcionIn, CohorteIn
from core.api.permissions import require_authenticated_group

router = Router(tags=["inscripciones"])


def _calcular_fecha_fin(bloque_fechas_id: int, fecha_inicio):
    semanas = SemanaConfig.objects.filter(bloque_id=bloque_fechas_id).count()
    total_semanas = semanas if semanas > 0 else 1
    return fecha_inicio + timedelta(days=(total_semanas * 7) - 1)


def _validar_bloque_programa(request: HttpRequest, programa_id: int, bloque_id: Optional[int]):
    if not bloque_id:
        return
    existe = Bloque.objects.filter(id=bloque_id, programa_id=programa_id).exists()
    if not existe:
        from ninja.errors import HttpError
        raise HttpError(400, "El bloque seleccionado no pertenece al programa indicado.")


# COHORTES - must be defined before /{inscripcion_id} to avoid routing conflict
@router.get("/cohortes", response=List[CohorteOut])
@require_authenticated_group
def listar_cohortes(request, programa_id: Optional[int] = None, bloque_id: Optional[int] = None):
    qs = Cohorte.objects.select_related("programa", "bloque_fechas").order_by("-fecha_inicio")
    if programa_id:
        qs = qs.filter(programa_id=programa_id)
    if bloque_id:
        qs = qs.filter(bloque_id=bloque_id)
    return [
        CohorteOut(
            id=c.id,
            nombre=c.nombre,
            programa_id=c.programa_id,
            bloque_id=c.bloque_id,
            bloque_fechas_id=c.bloque_fechas_id,
            fecha_inicio=c.fecha_inicio,
            fecha_fin=c.fecha_fin,
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


@router.delete("/{inscripcion_id}", response=dict)
@require_authenticated_group
def eliminar_inscripcion(request, inscripcion_id: int):
    insc = get_object_or_404(Inscripcion, pk=inscripcion_id)
    insc.delete()
    return {"deleted": True, "id": inscripcion_id}


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
        bloque_id=c.bloque_id,
        bloque_fechas_id=c.bloque_fechas_id,
        fecha_inicio=c.fecha_inicio,
        fecha_fin=c.fecha_fin,
    )


@router.post("/cohortes", response=CohorteOut)
@require_authenticated_group
def crear_cohorte(request, payload: CohorteIn):
    _validar_bloque_programa(request, payload.programa_id, payload.bloque_id)
    fecha_inicio = payload.fecha_inicio or timezone.now().date()
    fecha_fin = payload.fecha_fin or _calcular_fecha_fin(payload.bloque_fechas_id, fecha_inicio)
    cohorte = Cohorte.objects.create(
        nombre=payload.nombre,
        programa_id=payload.programa_id,
        bloque_id=payload.bloque_id,
        bloque_fechas_id=payload.bloque_fechas_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
    )
    return CohorteOut(
        id=cohorte.id,
        nombre=cohorte.nombre,
        programa_id=cohorte.programa_id,
        bloque_id=cohorte.bloque_id,
        bloque_fechas_id=cohorte.bloque_fechas_id,
        fecha_inicio=cohorte.fecha_inicio,
        fecha_fin=cohorte.fecha_fin,
    )


@router.put("/cohortes/{cohorte_id}", response=CohorteOut)
@router.patch("/cohortes/{cohorte_id}", response=CohorteOut)
@require_authenticated_group
def actualizar_cohorte(request, cohorte_id: int, payload: CohorteIn):
    _validar_bloque_programa(request, payload.programa_id, payload.bloque_id)
    cohorte = get_object_or_404(Cohorte, pk=cohorte_id)
    cohorte.nombre = payload.nombre
    cohorte.programa_id = payload.programa_id
    cohorte.bloque_id = payload.bloque_id
    cohorte.bloque_fechas_id = payload.bloque_fechas_id
    cohorte.fecha_inicio = payload.fecha_inicio or cohorte.fecha_inicio or timezone.now().date()
    cohorte.fecha_fin = payload.fecha_fin or _calcular_fecha_fin(cohorte.bloque_fechas_id, cohorte.fecha_inicio)
    cohorte.save(update_fields=["nombre", "programa_id", "bloque_id", "bloque_fechas_id", "fecha_inicio", "fecha_fin"])
    return CohorteOut(
        id=cohorte.id,
        nombre=cohorte.nombre,
        programa_id=cohorte.programa_id,
        bloque_id=cohorte.bloque_id,
        bloque_fechas_id=cohorte.bloque_fechas_id,
        fecha_inicio=cohorte.fecha_inicio,
        fecha_fin=cohorte.fecha_fin,
    )


@router.delete("/cohortes/{cohorte_id}", response=dict)
@require_authenticated_group
def eliminar_cohorte(request, cohorte_id: int):
    cohorte = get_object_or_404(Cohorte, pk=cohorte_id)
    cohorte.delete()
    return {"deleted": True, "id": cohorte_id}
