from typing import Dict, List
from ninja import Router, Schema
from django.shortcuts import get_object_or_404
from django.db.models import Q

from core.models import Cohorte, Nota, Asistencia, Inscripcion, Examen, Modulo, Bloque
from core.api.permissions import require_authenticated_group
from core.serializers import NotaSerializer

router = Router(tags=["historicos"])


class HistoricoCursosResponse(Schema):
    headers: List[str]
    rows: List[dict]


@router.get("/historico-cursos", response=HistoricoCursosResponse)
@require_authenticated_group
def historico_cursos(
    request,
    tipo_dato: str = "notas",
    programa_id: int = None,
    bloque_id: int = None,
    cohorte_id: int = None,
):
    """Devuelve historial de notas o asistencia con filtros opcionales por programa/bloque/cohorte.

    Respuesta: {"headers": [...], "rows": [ {header: valor, ...}, ... ]}
    """
    inscripciones_qs = Inscripcion.objects.select_related("cohorte", "cohorte__programa", "modulo", "modulo__bloque")
    if programa_id:
        inscripciones_qs = inscripciones_qs.filter(cohorte__programa_id=programa_id)
    if cohorte_id:
        inscripciones_qs = inscripciones_qs.filter(cohorte_id=cohorte_id)
    if bloque_id:
        inscripciones_qs = inscripciones_qs.filter(modulo__bloque_id=bloque_id)

    student_ids = list(inscripciones_qs.values_list("estudiante_id", flat=True).distinct())
    student_cohortes_map = {}
    for ins in inscripciones_qs:
        student_cohortes_map.setdefault(ins.estudiante_id, set()).add(ins.cohorte.nombre)

    tipo = (tipo_dato or "notas").lower()

    if tipo == "asistencia":
        qs = (
            Asistencia.objects.filter(estudiante_id__in=student_ids)
            .select_related("estudiante", "modulo", "modulo__bloque", "modulo__bloque__programa")
            .order_by("fecha")
        )
        if programa_id:
            qs = qs.filter(modulo__bloque__programa_id=programa_id)
        if bloque_id:
            qs = qs.filter(modulo__bloque_id=bloque_id)

        headers = ["ID", "Estudiante", "DNI", "Programa", "Cohorte", "Bloque", "Módulo", "Fecha", "Presente"]
        rows = []
        for a in qs:
            bloque = a.modulo.bloque if a.modulo else None
            rows.append({
                "ID": a.id,
                "Estudiante": f"{a.estudiante.apellido}, {a.estudiante.nombre}",
                "DNI": a.estudiante.dni,
                "Programa": bloque.programa.nombre if bloque and bloque.programa else "",
                "Cohorte": ", ".join(sorted(student_cohortes_map.get(a.estudiante_id, set()))),
                "Bloque": bloque.nombre if bloque else "",
                "Módulo": a.modulo.nombre if a.modulo else "",
                "Fecha": a.fecha.isoformat() if a.fecha else "",
                "Presente": "Sí" if a.presente else "No",
            })
        return {"headers": headers, "rows": rows}

    # default: notas
    qs = (
        Nota.objects.filter(estudiante_id__in=student_ids)
        .select_related(
            "estudiante",
            "examen",
            "examen__modulo",
            "examen__modulo__bloque",
            "examen__bloque",
            "examen__bloque__programa",
        )
        .order_by("fecha_calificacion")
    )
    if programa_id:
        qs = qs.filter(
            Q(examen__bloque__programa_id=programa_id) | Q(examen__modulo__bloque__programa_id=programa_id)
        )
    if bloque_id:
        qs = qs.filter(
            Q(examen__bloque_id=bloque_id) | Q(examen__modulo__bloque_id=bloque_id)
        )

    headers = ["ID", "Estudiante", "DNI", "Programa", "Cohorte", "Bloque", "Módulo", "Examen", "Calificación", "Aprobado", "Fecha"]
    rows = []
    for n in qs:
        bloque = n.examen.bloque or (n.examen.modulo.bloque if n.examen.modulo else None)
        modulo = n.examen.modulo
        rows.append({
            "ID": n.id,
            "Estudiante": f"{n.estudiante.apellido}, {n.estudiante.nombre}",
            "DNI": n.estudiante.dni,
            "Programa": bloque.programa.nombre if bloque and bloque.programa else "",
            "Cohorte": ", ".join(sorted(student_cohortes_map.get(n.estudiante_id, set()))),
            "Bloque": bloque.nombre if bloque else "",
            "Módulo": modulo.nombre if modulo else "",
            "Examen": n.examen.tipo_examen,
            "Calificación": float(n.calificacion) if n.calificacion is not None else "",
            "Aprobado": "Sí" if n.aprobado else "No",
            "Fecha": n.fecha_calificacion.date().isoformat() if n.fecha_calificacion else "",
        })
    return {"headers": headers, "rows": rows}


@router.get("/historico-estudiante", response=list)
@require_authenticated_group
def historico_estudiante(request, estudiante_id: int):
    """Devuelve todas las notas de un estudiante con datos del examen/módulo/bloque."""
    qs = (
        Nota.objects.select_related(
            "examen",
            "examen__modulo",
            "examen__bloque",
            "examen__modulo__bloque",
            "estudiante",
        )
        .filter(estudiante_id=estudiante_id)
        .order_by("-fecha_calificacion", "-created_at")
    )
    return NotaSerializer(qs, many=True).data
