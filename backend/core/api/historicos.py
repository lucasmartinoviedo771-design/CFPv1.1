from typing import Dict, List
from ninja import Router
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch

from core.models import Cohorte, Nota, Asistencia, Inscripcion, Examen, Modulo, Bloque
from core.api.permissions import require_authenticated_group
from core.serializers import NotaSerializer

router = Router(tags=["historicos"])


def _cohorte_programa(cohorte_id: int):
    cohorte = get_object_or_404(Cohorte.objects.select_related("programa"), pk=cohorte_id)
    return cohorte, cohorte.programa


@router.get("/historico-cursos", response=Dict[str, List[dict]])
@require_authenticated_group
def historico_cursos(request, cohorte_id: int, tipo_dato: str = "notas"):
    """Devuelve historial de notas o asistencia para una cohorte.

    Respuesta: {"headers": [...], "rows": [ {header: valor, ...}, ... ]}
    """
    cohorte, programa = _cohorte_programa(cohorte_id)
    tipo = (tipo_dato or "notas").lower()

    if tipo == "asistencia":
        qs = (
            Asistencia.objects.filter(estudiante__inscripciones__cohorte_id=cohorte_id)
            .select_related("estudiante", "modulo", "modulo__bloque", "modulo__bloque__programa")
            .order_by("fecha")
        )
        headers = ["ID", "Estudiante", "DNI", "Programa", "Cohorte", "Bloque", "Módulo", "Fecha", "Presente"]
        rows = []
        for a in qs:
            bloque = a.modulo.bloque if a.modulo else None
            rows.append({
                "ID": a.id,
                "Estudiante": f"{a.estudiante.apellido}, {a.estudiante.nombre}",
                "DNI": a.estudiante.dni,
                "Programa": bloque.programa.nombre if bloque and bloque.programa else programa.nombre,
                "Cohorte": cohorte.nombre,
                "Bloque": bloque.nombre if bloque else "",
                "Módulo": a.modulo.nombre if a.modulo else "",
                "Fecha": a.fecha.isoformat() if a.fecha else "",
                "Presente": "Sí" if a.presente else "No",
            })
        return {"headers": headers, "rows": rows}

    # default: notas
    qs = (
        Nota.objects.filter(estudiante__inscripciones__cohorte_id=cohorte_id)
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
    headers = ["ID", "Estudiante", "DNI", "Programa", "Cohorte", "Bloque", "Módulo", "Examen", "Calificación", "Aprobado", "Fecha"]
    rows = []
    for n in qs:
        bloque = n.examen.bloque or (n.examen.modulo.bloque if n.examen.modulo else None)
        modulo = n.examen.modulo
        rows.append({
            "ID": n.id,
            "Estudiante": f"{n.estudiante.apellido}, {n.estudiante.nombre}",
            "DNI": n.estudiante.dni,
            "Programa": bloque.programa.nombre if bloque and bloque.programa else programa.nombre,
            "Cohorte": cohorte.nombre,
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
