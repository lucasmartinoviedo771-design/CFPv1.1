from django.db.models import Avg, Count, Q
from ninja import Router
from core.api.permissions import require_authenticated_group

from core.models import Asistencia, Inscripcion, Nota, Programa

router = Router(tags=["dashboard"])


@router.get("/dashboard-stats", response=dict)
@require_authenticated_group
def dashboard_stats(request):
    active_students_count = Inscripcion.objects.filter(estado="ACTIVO").aggregate(
        count=Count("estudiante", distinct=True)
    )["count"]

    graduated_students_count = Inscripcion.objects.filter(estado="EGRESADO").aggregate(
        count=Count("estudiante", distinct=True)
    )["count"]

    attendance_stats = Asistencia.objects.aggregate(
        total_asistencias=Count("id"),
        presentes=Count("id", filter=Q(presente=True)),
    )
    total_asistencias = attendance_stats["total_asistencias"]
    presentes = attendance_stats["presentes"]
    attendance_rate = (presentes / total_asistencias * 100) if total_asistencias else 0

    nota_stats = Nota.objects.aggregate(
        total_notas=Count("id"),
        aprobados=Count("id", filter=Q(aprobado=True)),
    )
    total_notas = nota_stats["total_notas"]
    aprobados = nota_stats["aprobados"]
    pass_rate = (aprobados / total_notas * 100) if total_notas else 0

    program_data = (
        Programa.objects.annotate(
            student_count=Count("cohortes__inscripciones__estudiante", distinct=True)
        )
        .values("nombre", "student_count")
    )
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
