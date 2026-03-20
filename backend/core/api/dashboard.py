from datetime import date
from django.db.models import Avg, Count, Q
from ninja import Router
from core.api.permissions import require_authenticated_group

from core.models import Asistencia, Estudiante, Inscripcion, Nota, Programa, Cohorte, Bloque

router = Router(tags=["dashboard"])


@router.get("/dashboard-stats", response=dict)
@require_authenticated_group
def dashboard_stats(
    request,
    programa_id: int = None,
    bloque_id: int = None,
    cohorte_id: int = None,
    fecha_desde: date = None,
    fecha_hasta: date = None,
):
    inscripciones_qs = Inscripcion.objects.select_related("cohorte", "modulo", "modulo__bloque")
    if programa_id:
        inscripciones_qs = inscripciones_qs.filter(cohorte__programa_id=programa_id)
    if cohorte_id:
        inscripciones_qs = inscripciones_qs.filter(cohorte_id=cohorte_id)
    if bloque_id:
        inscripciones_qs = inscripciones_qs.filter(modulo__bloque_id=bloque_id)
    if fecha_desde:
        inscripciones_qs = inscripciones_qs.filter(cohorte__fecha_inicio__gte=fecha_desde)
    if fecha_hasta:
        inscripciones_qs = inscripciones_qs.filter(cohorte__fecha_inicio__lte=fecha_hasta)

    student_ids_qs = inscripciones_qs.values_list("estudiante_id", flat=True).distinct()
    scoped_estudiantes = Estudiante.objects.filter(id__in=student_ids_qs)
    # Solo devolver todos los estudiantes si NO hay ningún filtro activo (ni fecha, ni programa, etc.)
    if not programa_id and not cohorte_id and not bloque_id and not fecha_desde and not fecha_hasta:
        scoped_estudiantes = Estudiante.objects.all()

    # "Activos" para el padrón: estudiantes no dados de baja (Regular/Libre).
    active_students_count = scoped_estudiantes.exclude(estatus="Baja").count()

    # Lógica de egresados automáticos (igual que en analytics/_graduates)
    finals_types = ["FINAL_VIRTUAL", "FINAL_SINC", "EQUIVALENCIA"]
    bloques_req_qs = Bloque.objects.all()
    if programa_id:
        bloques_req_qs = bloques_req_qs.filter(programa_id=programa_id)
    
    program_bloques_req = {}
    for b in bloques_req_qs.values("id", "programa_id"):
        p_id = b["programa_id"]
        if p_id not in program_bloques_req:
            program_bloques_req[p_id] = set()
        program_bloques_req[p_id].add(b["id"])

    # Contar bloques aprobados por estudiante
    aprobados_qs = Nota.objects.filter(
        aprobado=True,
        examen__tipo_examen__in=finals_types,
        estudiante_id__in=student_ids_qs
    )
    if programa_id:
        aprobados_qs = aprobados_qs.filter(examen__bloque__programa_id=programa_id)
    
    aprobados_por_est = (
        aprobados_qs.values("estudiante_id", "examen__bloque__programa_id")
        .annotate(bloques_aprobados=Count("examen__bloque", distinct=True))
    )

    graduated_program_pairs = set() # (est_id, prog_id)
    for item in aprobados_por_est:
        p_id = item["examen__bloque__programa_id"]
        if p_id in program_bloques_req:
            if item["bloques_aprobados"] >= len(program_bloques_req[p_id]):
                graduated_program_pairs.add((item["estudiante_id"], p_id))
    
    # También incluimos los que tengan estado="EGRESADO" explícitamente
    explicit_grad_info = inscripciones_qs.filter(estado="EGRESADO").values_list("estudiante_id", "cohorte__programa_id")
    for est_id, p_id in explicit_grad_info:
        graduated_program_pairs.add((est_id, p_id))

    all_graduated_ids = {pair[0] for pair in graduated_program_pairs}
    graduated_students_count = len(all_graduated_ids)

    # --- DESGLOSES PARA SUB-DASHBOARD (NAVEGABLE) ---

    # Activos: Estructura { "Programa": { "Total": X, "Cohortes": [ { "name": Y, "count": Z } ] } }
    active_details = {}
    active_insc_qs = inscripciones_qs.exclude(estudiante__estatus="Baja").values(
        "estudiante_id", "cohorte__programa__nombre", "cohorte__nombre", "cohorte__fecha_inicio"
    ).order_by("-cohorte__fecha_inicio")
    
    # Asegurar unicidad (un estudiante puede estar en varios módulos pero es una sola persona activa en el programa)
    processed_actives = set()
    for ai in active_insc_qs:
        pair = (ai["estudiante_id"], ai["cohorte__programa__nombre"])
        if pair not in processed_actives:
            p_name = ai["cohorte__programa__nombre"]
            c_name = ai["cohorte__nombre"]
            
            if p_name not in active_details:
                active_details[p_name] = {"name": p_name, "count": 0, "cohorts": {}}
            
            active_details[p_name]["count"] += 1
            active_details[p_name]["cohorts"][c_name] = active_details[p_name]["cohorts"].get(c_name, 0) + 1
            processed_actives.add(pair)

    active_breakdown = []
    for p_val in active_details.values():
        p_val["cohorts"] = sorted([{"name": k, "count": v} for k, v in p_val["cohorts"].items()], key=lambda x: x["count"], reverse=True)
        active_breakdown.append(p_val)
    active_breakdown = sorted(active_breakdown, key=lambda x: x["count"], reverse=True)


    # Egresados: Misma estructura navegable
    graduated_details = {}
    processed_grads = set()
    
    target_progs = {pair[1] for pair in graduated_program_pairs}
    grad_insc_qs = Inscripcion.objects.filter(
        estudiante_id__in=all_graduated_ids,
        cohorte__programa_id__in=target_progs
    ).values(
        "estudiante_id", "cohorte__programa_id", "cohorte__programa__nombre", 
        "cohorte__nombre", "cohorte__fecha_inicio"
    ).order_by("-cohorte__fecha_inicio")

    for gi in grad_insc_qs:
        pair = (gi["estudiante_id"], gi["cohorte__programa_id"])
        if pair in graduated_program_pairs and pair not in processed_grads:
            p_name = gi["cohorte__programa__nombre"]
            c_name = gi["cohorte__nombre"]
            
            if p_name not in graduated_details:
                graduated_details[p_name] = {"name": p_name, "count": 0, "cohorts": {}}
            
            graduated_details[p_name]["count"] += 1
            graduated_details[p_name]["cohorts"][c_name] = graduated_details[p_name]["cohorts"].get(c_name, 0) + 1
            processed_grads.add(pair)

    graduated_breakdown = []
    for p_val in graduated_details.values():
        p_val["cohorts"] = sorted([{"name": k, "count": v} for k, v in p_val["cohorts"].items()], key=lambda x: x["count"], reverse=True)
        graduated_breakdown.append(p_val)
    graduated_breakdown = sorted(graduated_breakdown, key=lambda x: x["count"], reverse=True)

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
    if fecha_desde:
        attendance_qs = attendance_qs.filter(fecha__gte=fecha_desde)
    if fecha_hasta:
        attendance_qs = attendance_qs.filter(fecha__lte=fecha_hasta)

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
    if fecha_desde:
        notas_qs = notas_qs.filter(examen__fecha__gte=fecha_desde)
    if fecha_hasta:
        notas_qs = notas_qs.filter(examen__fecha__lte=fecha_hasta)

    nota_stats = notas_qs.aggregate(
        total_notas=Count("id"),
        aprobados=Count("id", filter=Q(aprobado=True)),
    )
    total_notas = nota_stats["total_notas"]
    aprobados = nota_stats["aprobados"]
    pass_rate = (aprobados / total_notas * 100) if total_notas else 0

    # Desglose de Aprobación por Programa y Bloque
    pass_by_prog = (
        notas_qs.values("examen__bloque__programa__nombre")
        .annotate(rate=Avg("aprobado"), total=Count("id"))
        .order_by("-rate")
    )
    pass_by_bloque = (
        notas_qs.values("examen__bloque__nombre")
        .annotate(rate=Avg("aprobado"), total=Count("id"))
        .order_by("-rate")[:15]
    )

    # --- TENDENCIA ANUAL ---
    from django.db.models.functions import ExtractYear
    yearly_data = (
        inscripciones_qs.annotate(year=ExtractYear("created_at"))
        .values("year")
        .annotate(count=Count("estudiante_id", distinct=True))
        .order_by("year")
    )
    yearly_trend = [{"year": str(item["year"]), "count": item["count"]} for item in yearly_data if item["year"]]

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
        "active_breakdown": active_breakdown,
        "graduated_breakdown": graduated_breakdown,
        "pass_breakdown": {
            "by_program": [{"name": x["examen__bloque__programa__nombre"], "rate": round(float(x["rate"] or 0)*100, 1), "total": x["total"]} for x in pass_by_prog],
            "by_block": [{"name": x["examen__bloque__nombre"], "rate": round(float(x["rate"] or 0)*100, 1), "total": x["total"]} for x in pass_by_bloque]
        },
        "yearly_trend": yearly_trend,
        "programs_chart": {
            "labels": program_labels,
            "counts": program_counts,
        },
    }
