from django.db.models import Avg, Count, Q
from ninja import Router
from core.api.permissions import require_authenticated_group

from core.models import Asistencia, Estudiante, Inscripcion, Nota, Programa, Cohorte

router = Router(tags=["dashboard"])


@router.get("/dashboard-stats", response=dict)
@require_authenticated_group
def dashboard_stats(request, programa_id: int = None, bloque_id: int = None, cohorte_id: int = None):
    inscripciones_qs = Inscripcion.objects.select_related("cohorte", "modulo", "modulo__bloque")
    if programa_id:
        inscripciones_qs = inscripciones_qs.filter(cohorte__programa_id=programa_id)
    if cohorte_id:
        inscripciones_qs = inscripciones_qs.filter(cohorte_id=cohorte_id)
    if bloque_id:
        inscripciones_qs = inscripciones_qs.filter(modulo__bloque_id=bloque_id)

    student_ids_qs = inscripciones_qs.values_list("estudiante_id", flat=True).distinct()
    scoped_estudiantes = Estudiante.objects.filter(id__in=student_ids_qs)
    if not programa_id and not cohorte_id and not bloque_id:
        scoped_estudiantes = Estudiante.objects.all()

    # "Activos" para el padrón: estudiantes no dados de baja (Regular/Libre).
    active_students_count = scoped_estudiantes.exclude(estatus="Baja").count()

    graduated_students_count = (
        inscripciones_qs.filter(estado="EGRESADO")
        .aggregate(count=Count("estudiante", distinct=True))
        .get("count")
        or 0
    )

    attendance_qs = Asistencia.objects.all()
    if bloque_id:
        attendance_qs = attendance_qs.filter(modulo__bloque_id=bloque_id)
    elif programa_id:
        attendance_qs = attendance_qs.filter(modulo__bloque__programa_id=programa_id)
    elif cohorte_id:
        try:
            cohorte_programa_id = Cohorte.objects.only("programa_id").get(id=cohorte_id).programa_id
            attendance_qs = attendance_qs.filter(modulo__bloque__programa_id=cohorte_programa_id)
        except Cohorte.DoesNotExist:
            attendance_qs = attendance_qs.none()
    if programa_id or cohorte_id or bloque_id:
        attendance_qs = attendance_qs.filter(estudiante_id__in=student_ids_qs)

    attendance_stats = attendance_qs.aggregate(
        total_asistencias=Count("id"),
        presentes=Count("id", filter=Q(presente=True)),
    )
    total_asistencias = attendance_stats["total_asistencias"]
    presentes = attendance_stats["presentes"]
    attendance_rate = (presentes / total_asistencias * 100) if total_asistencias else 0

    notas_qs = Nota.objects.all()
    if bloque_id:
        notas_qs = notas_qs.filter(
            Q(examen__bloque_id=bloque_id) | Q(examen__modulo__bloque_id=bloque_id)
        )
    elif programa_id:
        notas_qs = notas_qs.filter(
            Q(examen__bloque__programa_id=programa_id)
            | Q(examen__modulo__bloque__programa_id=programa_id)
        )
    elif cohorte_id:
        try:
            cohorte_programa_id = Cohorte.objects.only("programa_id").get(id=cohorte_id).programa_id
            notas_qs = notas_qs.filter(
                Q(examen__bloque__programa_id=cohorte_programa_id)
                | Q(examen__modulo__bloque__programa_id=cohorte_programa_id)
            )
        except Cohorte.DoesNotExist:
            notas_qs = notas_qs.none()
    if programa_id or cohorte_id or bloque_id:
        notas_qs = notas_qs.filter(estudiante_id__in=student_ids_qs)

    nota_stats = notas_qs.aggregate(
        total_notas=Count("id"),
        aprobados=Count("id", filter=Q(aprobado=True)),
    )
    total_notas = nota_stats["total_notas"]
    aprobados = nota_stats["aprobados"]
    pass_rate = (aprobados / total_notas * 100) if total_notas else 0

    program_data = (
        Programa.objects.annotate(
            student_count=Count(
                "cohortes__inscripciones__estudiante",
                filter=Q(cohortes__inscripciones__estudiante_id__in=student_ids_qs) if (programa_id or cohorte_id or bloque_id) else Q(),
                distinct=True,
            )
        )
        .values("nombre", "student_count")
        .order_by("nombre")
    )
    if programa_id:
        program_data = program_data.filter(id=programa_id)
    program_labels = [item["nombre"] for item in program_data]
    program_counts = [item["student_count"] for item in program_data]

    return {
        "active_students_count": active_students_count,
        "graduated_students_count": graduated_students_count,
        "attendance_rate": round(attendance_rate, 2),
        "pass_rate": round(pass_rate, 2),
        "programs_chart": {
            "labels": program_labels,
            "counts": program_counts,
        },
    }
