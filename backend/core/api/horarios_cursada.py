from datetime import timedelta
from typing import List, Optional

from django.shortcuts import get_object_or_404
from ninja import Router
from ninja.errors import HttpError

from core.api.permissions import require_authenticated_group, require_admin

from django.contrib.auth.models import User
from core.models import HorarioCursada, Cohorte, Bloque, Modulo, Programa
from .schemas import HorarioCursadaOut, HorarioCursadaIn, ClaseProgramadaOut, HorariosCursadaMetadataOut

router = Router(tags=["horarios-cursada"])


DIAS_VALIDOS = {
    "LUNES",
    "MARTES",
    "MIERCOLES",
    "JUEVES",
    "VIERNES",
    "SABADO",
    "DOMINGO",
}

DAY_MAP = {
    "LUNES": 0,
    "MARTES": 1,
    "MIERCOLES": 2,
    "JUEVES": 3,
    "VIERNES": 4,
    "SABADO": 5,
    "DOMINGO": 6,
}


def _validar_relaciones(payload: HorarioCursadaIn):
    cohorte = get_object_or_404(Cohorte, pk=payload.cohorte_id)
    bloque = get_object_or_404(Bloque, pk=payload.bloque_id)

    if cohorte.programa_id != bloque.programa_id:
        raise HttpError(400, "El bloque no pertenece al programa de la cohorte.")

    if cohorte.bloque_id and cohorte.bloque_id != bloque.id:
        raise HttpError(400, "La cohorte está asociada a otro bloque.")

    if payload.modulo_id:
        modulo = get_object_or_404(Modulo, pk=payload.modulo_id)
        if modulo.bloque_id != bloque.id:
            raise HttpError(400, "El módulo no pertenece al bloque seleccionado.")

    if payload.dia_semana not in DIAS_VALIDOS:
        raise HttpError(400, "Día de semana inválido.")

    if payload.hora_fin <= payload.hora_inicio:
        raise HttpError(400, "La hora de fin debe ser mayor que la hora de inicio.")

    minutos_inicio = payload.hora_inicio.hour * 60 + payload.hora_inicio.minute
    minutos_fin = payload.hora_fin.hour * 60 + payload.hora_fin.minute
    if (minutos_fin - minutos_inicio) % (24 * 60) != 40:
        raise HttpError(400, "La hora de fin debe ser exactamente 40 minutos después de la hora de inicio.")


def _to_out(h: HorarioCursada):
    docente_nombre = None
    if h.docente_id:
        nombre = f"{h.docente.first_name or ''} {h.docente.last_name or ''}".strip()
        docente_nombre = nombre or h.docente.username
    return HorarioCursadaOut(
        id=h.id,
        cohorte_id=h.cohorte_id,
        bloque_id=h.bloque_id,
        modulo_id=h.modulo_id,
        docente_id=h.docente_id,
        docente_nombre=docente_nombre,
        dia_semana=h.dia_semana,
        hora_inicio=h.hora_inicio,
        hora_fin=h.hora_fin,
    )




@router.get("/metadata", response=HorariosCursadaMetadataOut)
@require_authenticated_group
def get_metadata(request):
    programas = list(Programa.objects.all().values("id", "codigo", "nombre", "activo", "resolucion_id"))
    bloques = list(Bloque.objects.all().values("id", "nombre", "programa_id"))
    cohortes = list(Cohorte.objects.all().values("id", "nombre", "programa_id", "bloque_id", "bloque_fechas_id", "fecha_inicio", "fecha_fin"))
    modulos = list(Modulo.objects.all().values("id", "nombre", "bloque_id"))
    
    docentes_qs = User.objects.filter(groups__name__in=["Docente", "Regencia"]).distinct().values("id", "username", "first_name", "last_name")
    
    horarios_qs = HorarioCursada.objects.select_related("cohorte", "bloque", "modulo", "docente").order_by(
        "cohorte_id", "bloque_id", "modulo_id", "dia_semana", "hora_inicio"
    )
    horarios = [_to_out(h) for h in horarios_qs]

    return {
        "programas": programas,
        "bloques": bloques,
        "cohortes": cohortes,
        "docentes": list(docentes_qs),
        "horarios": horarios,
        "modulos": modulos
    }


@router.get("/clases-programadas", response=List[ClaseProgramadaOut])
@require_authenticated_group
def clases_programadas(
    request,
    cohorte_id: Optional[int] = None,
    bloque_id: Optional[int] = None,
    modulo_id: Optional[int] = None,
):
    qs = HorarioCursada.objects.select_related("cohorte", "docente")
    if cohorte_id:
        qs = qs.filter(cohorte_id=cohorte_id)
    if bloque_id:
        qs = qs.filter(bloque_id=bloque_id)
    if modulo_id:
        qs = qs.filter(modulo_id=modulo_id)
    horarios = list(qs.order_by("cohorte_id", "dia_semana", "hora_inicio"))

    clases = []
    for h in horarios:
        coh = h.cohorte
        if not coh.fecha_inicio or not coh.fecha_fin:
            continue
        target_weekday = DAY_MAP.get(h.dia_semana)
        if target_weekday is None:
            continue
        start = coh.fecha_inicio + timedelta(days=(target_weekday - coh.fecha_inicio.weekday()) % 7)
        fecha = start
        while fecha <= coh.fecha_fin:
            docente_nombre = None
            if h.docente_id:
                nombre = f"{h.docente.first_name or ''} {h.docente.last_name or ''}".strip()
                docente_nombre = nombre or h.docente.username
            clases.append(
                ClaseProgramadaOut(
                    cohorte_id=h.cohorte_id,
                    bloque_id=h.bloque_id,
                    modulo_id=h.modulo_id,
                    docente_id=h.docente_id,
                    docente_nombre=docente_nombre,
                    dia_semana=h.dia_semana,
                    fecha=fecha,
                    hora_inicio=h.hora_inicio,
                    hora_fin=h.hora_fin,
                )
            )
            fecha += timedelta(days=7)

    clases.sort(key=lambda x: (x.fecha, x.hora_inicio, x.cohorte_id, x.bloque_id, x.modulo_id or 0))
    return clases


@router.get("", response=List[HorarioCursadaOut])
@require_authenticated_group
def listar_horarios(
    request,
    programa_id: Optional[int] = None,
    bloque_id: Optional[int] = None,
    cohorte_id: Optional[int] = None,
    modulo_id: Optional[int] = None,
):
    qs = HorarioCursada.objects.select_related("cohorte", "bloque", "modulo", "docente").order_by(
        "cohorte_id", "bloque_id", "modulo_id", "dia_semana", "hora_inicio"
    )
    if programa_id:
        qs = qs.filter(cohorte__programa_id=programa_id)
    if bloque_id:
        qs = qs.filter(bloque_id=bloque_id)
    if cohorte_id:
        qs = qs.filter(cohorte_id=cohorte_id)
    if modulo_id:
        qs = qs.filter(modulo_id=modulo_id)

    return [_to_out(h) for h in qs]


@router.get("/{horario_id}", response=HorarioCursadaOut)
@require_authenticated_group
def detalle_horario(request, horario_id: int):
    h = get_object_or_404(HorarioCursada.objects.select_related("docente"), pk=horario_id)
    return _to_out(h)


@router.post("", response=HorarioCursadaOut)
@require_admin
def crear_horario(request, payload: HorarioCursadaIn):
    _validar_relaciones(payload)
    h = HorarioCursada.objects.create(**payload.dict())
    return detalle_horario(request, h.id)


@router.put("/{horario_id}", response=HorarioCursadaOut)
@router.patch("/{horario_id}", response=HorarioCursadaOut)
@require_admin
def actualizar_horario(request, horario_id: int, payload: HorarioCursadaIn):
    _validar_relaciones(payload)
    h = get_object_or_404(HorarioCursada, pk=horario_id)
    h.cohorte_id = payload.cohorte_id
    h.bloque_id = payload.bloque_id
    h.modulo_id = payload.modulo_id
    h.dia_semana = payload.dia_semana
    h.hora_inicio = payload.hora_inicio
    h.hora_fin = payload.hora_fin
    h.save()
    return detalle_horario(request, h.id)


@router.delete("/{horario_id}", response=dict)
@require_admin
def eliminar_horario(request, horario_id: int):
    h = get_object_or_404(HorarioCursada, pk=horario_id)
    h.delete()
    return {"deleted": True, "id": horario_id}


