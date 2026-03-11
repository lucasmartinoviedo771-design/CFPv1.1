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


def shorten(txt: str) -> str:
    if not txt:
        return ""
    return txt.replace("Programador de Nivel III", "Prog. N III") \
              .replace("Programación", "Prog.") \
              .replace("Módulo", "Mód.") \
              .replace("Cohorte", "Coh.")


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
    
    # Map para mostrar la cohorte específica del módulo, y como fallback la del programa
    student_prog_cohortes_map = {}
    student_modulo_cohortes_map = {}
    for ins in inscripciones_qs:
        prog_id = ins.cohorte.programa_id
        student_prog_cohortes_map.setdefault((ins.estudiante_id, prog_id), set()).add(ins.cohorte.nombre)
        if ins.modulo_id:
            student_modulo_cohortes_map.setdefault((ins.estudiante_id, ins.modulo_id), set()).add(ins.cohorte.nombre)

    tipo = (tipo_dato or "notas").lower()

    if tipo == "asistencia":
        qs = (
            Asistencia.objects.filter(estudiante_id__in=student_ids)
            .select_related("estudiante", "modulo", "modulo__bloque", "modulo__bloque__programa")
            .order_by("estudiante__apellido", "estudiante__nombre", "fecha")
        )
        if programa_id:
            qs = qs.filter(modulo__bloque__programa_id=programa_id)
        if bloque_id:
            qs = qs.filter(modulo__bloque_id=bloque_id)

        headers = ["ID", "Estudiante", "DNI", "Teléfono", "Programa", "Cohorte", "Bloque", "Módulo", "Fecha", "Presente"]
        rows = []
        for a in qs:
            modulo_id = a.modulo_id
            bloque = a.modulo.bloque if a.modulo else None
            programa = bloque.programa if bloque and bloque.programa else None
            prog_id = programa.id if programa else None
            
            cohortes = set()
            if modulo_id:
                cohortes = student_modulo_cohortes_map.get((a.estudiante_id, modulo_id), set())
            if not cohortes:
                cohortes = student_prog_cohortes_map.get((a.estudiante_id, prog_id), set())
            
            rows.append({
                "ID": a.id,
                "Estudiante": f"{a.estudiante.apellido}, {a.estudiante.nombre}",
                "DNI": a.estudiante.dni,
                "Teléfono": a.estudiante.telefono or "",
                "Programa": shorten(programa.nombre if programa else ""),
                "Cohorte": shorten(", ".join(sorted(cohortes))),
                "Bloque": shorten(bloque.nombre if bloque else ""),
                "Módulo": shorten(a.modulo.nombre if a.modulo else ""),
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
        .order_by("estudiante__apellido", "estudiante__nombre", "fecha_calificacion")
    )
    if programa_id:
        qs = qs.filter(
            Q(examen__bloque__programa_id=programa_id) | Q(examen__modulo__bloque__programa_id=programa_id)
        )
    if bloque_id:
        qs = qs.filter(
            Q(examen__bloque_id=bloque_id) | Q(examen__modulo__bloque_id=bloque_id)
        )

    headers = ["ID", "Estudiante", "DNI", "Teléfono", "Programa", "Cohorte", "Bloque", "Módulo", "Examen", "Calificación", "Aprobado", "Fecha"]
    rows = []
    for n in qs:
        bloque = n.examen.bloque or (n.examen.modulo.bloque if n.examen.modulo else None)
        modulo = n.examen.modulo
        modulo_id = modulo.id if modulo else None
        programa = bloque.programa if bloque and bloque.programa else None
        prog_id = programa.id if programa else None
        
        cohortes = set()
        if modulo_id:
            cohortes = student_modulo_cohortes_map.get((n.estudiante_id, modulo_id), set())
        if not cohortes:
            cohortes = student_prog_cohortes_map.get((n.estudiante_id, prog_id), set())
        
        rows.append({
            "ID": n.id,
            "Estudiante": f"{n.estudiante.apellido}, {n.estudiante.nombre}",
            "DNI": n.estudiante.dni,
            "Teléfono": n.estudiante.telefono or "",
            "Programa": shorten(programa.nombre if programa else ""),
            "Cohorte": shorten(", ".join(sorted(cohortes))),
            "Bloque": shorten(bloque.nombre if bloque else ""),
            "Módulo": shorten(modulo.nombre if modulo else ""),
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
