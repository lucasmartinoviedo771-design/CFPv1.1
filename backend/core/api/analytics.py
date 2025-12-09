from datetime import timedelta
from django.db.models import Avg, Count, Exists, OuterRef, Q
from django.db.models.functions import TruncMonth, TruncWeek
from django.utils.dateparse import parse_date
from ninja import Router
from core.api.permissions import require_authenticated_group

from core.models import Inscripcion, Asistencia, Nota, Estudiante, Cohorte, Bloque, Examen

router = Router(tags=["analytics"])


@router.get("/inscriptos", response=list)
@require_authenticated_group
def inscriptos(request):
    qs = Inscripcion.objects.values("cohorte__programa__codigo", "cohorte__nombre").annotate(inscriptos=Count("id"))
    return list(qs)


@router.get("/asistencia-promedio", response=list)
@require_authenticated_group
def asistencia_promedio(request):
    qs = (
        Asistencia.objects.values("modulo__id", "modulo__nombre")
        .annotate(asistencia_promedio=Avg("presente"))
        .order_by("modulo__id")
    )
    return list(qs)


@router.get("/aprobacion-por-examen", response=list)
@require_authenticated_group
def aprobacion_por_examen(request):
    qs = (
        Nota.objects.values("examen__modulo__id", "examen__tipo_examen")
        .annotate(tasa_aprob=Avg("aprobado"))
        .order_by("examen__modulo__id")
    )
    return list(qs)


@router.get("/equivalencias", response=list)
@require_authenticated_group
def equivalencias(request):
    qs = Nota.objects.filter(es_equivalencia=True).values("examen__modulo__id").annotate(count=Count("id"))
    return list(qs)


@router.get("/enrollments", response=dict)
@require_authenticated_group
def analytics_enrollments(request, programa_id: int = None, cohorte_id: int = None, date_from: str = None, date_to: str = None, group_by: str = "month"):
    qs = Inscripcion.objects.all()
    if programa_id:
        qs = qs.filter(cohorte__programa_id=programa_id)
    if cohorte_id:
        qs = qs.filter(cohorte_id=cohorte_id)
    if date_from:
        df = parse_date(date_from)
        if df:
            qs = qs.filter(created_at__date__gte=df)
    if date_to:
        dt = parse_date(date_to)
        if dt:
            qs = qs.filter(created_at__date__lte=dt)

    if group_by.lower() == "month":
        data = (
            qs.annotate(period=TruncMonth("created_at"))
            .values("period")
            .annotate(count=Count("id"))
            .order_by("period")
        )
        series = [{"period": item["period"].date().isoformat(), "count": item["count"]} for item in data]
    else:
        series = [{"period": None, "count": qs.count()}]

    return {"total": qs.count(), "series": series}


@router.get("/attendance", response=dict)
@require_authenticated_group
def analytics_attendance(
    request,
    programa_id: int = None,
    cohorte_id: int = None,
    modulo_id: int = None,
    date_from: str = None,
    date_to: str = None,
    group_by: str = "module",
):
    qs = Asistencia.objects.all()
    if modulo_id:
        qs = qs.filter(modulo_id=modulo_id)
    if cohorte_id:
        try:
            cohorte = Cohorte.objects.get(id=cohorte_id)
            qs = qs.filter(modulo__bloque__programa=cohorte.programa)
        except Cohorte.DoesNotExist:
            qs = qs.none()
    if programa_id and not cohorte_id:
        qs = qs.filter(modulo__bloque__programa_id=programa_id)
    if date_from:
        df = parse_date(date_from)
        if df:
            qs = qs.filter(fecha__gte=df)
    if date_to:
        dt = parse_date(date_to)
        if dt:
            qs = qs.filter(fecha__lte=dt)

    overall = qs.aggregate(total=Count("id"), presentes=Count("id", filter=Q(presente=True)), rate=Avg("presente"))

    if group_by == "module":
        data = (
            qs.values("modulo__id", "modulo__nombre")
            .annotate(rate=Avg("presente"), total=Count("id"))
            .order_by("modulo__id")
        )
        series = [
            {
                "modulo_id": item["modulo__id"],
                "modulo_nombre": item["modulo__nombre"],
                "rate": float(item["rate"] or 0),
                "total": item["total"],
            }
            for item in data
        ]
    elif group_by == "week":
        data = (
            qs.annotate(period=TruncWeek("fecha"))
            .values("period")
            .annotate(rate=Avg("presente"), total=Count("id"))
            .order_by("period")
        )
        series = [
            {
                "period": item["period"].date().isoformat(),
                "rate": float(item["rate"] or 0),
                "total": item["total"],
            }
            for item in data
        ]
    else:
        series = []

    return {
        "overall": {
            "total": overall.get("total", 0),
            "presentes": overall.get("presentes", 0),
            "rate": float(overall.get("rate") or 0),
        },
        "series": series,
    }


@router.get("/grades", response=dict)
@require_authenticated_group
def analytics_grades(
    request,
    programa_id: int = None,
    cohorte_id: int = None,
    modulo_id: int = None,
    tipo_examen: str = None,
    date_from: str = None,
    date_to: str = None,
):
    qs = Nota.objects.select_related("examen", "examen__modulo", "examen__bloque")
    if modulo_id:
        qs = qs.filter(examen__modulo_id=modulo_id)
    if cohorte_id:
        try:
            cohorte = Cohorte.objects.get(id=cohorte_id)
            qs = qs.filter(
                Q(examen__modulo__bloque__programa=cohorte.programa)
                | Q(examen__bloque__programa=cohorte.programa)
            )
        except Cohorte.DoesNotExist:
            qs = qs.none()
    if programa_id and not cohorte_id:
        qs = qs.filter(
            Q(examen__modulo__bloque__programa_id=programa_id) | Q(examen__bloque__programa_id=programa_id)
        )
    if tipo_examen:
        qs = qs.filter(examen__tipo_examen=tipo_examen)
    if date_from:
        df = parse_date(date_from)
        if df:
            qs = qs.filter(fecha_calificacion__date__gte=df)
    if date_to:
        dt = parse_date(date_to)
        if dt:
            qs = qs.filter(fecha_calificacion__date__lte=dt)

    aprob_por_tipo = (
        qs.values("examen__tipo_examen").annotate(rate=Avg("aprobado"), total=Count("id")).order_by("examen__tipo_examen")
    )
    aprobacion = [
        {"tipo_examen": item["examen__tipo_examen"], "rate": float(item["rate"] or 0), "total": item["total"]}
        for item in aprob_por_tipo
    ]

    overall = qs.aggregate(total=Count("id"), aprobados=Count("id", filter=Q(aprobado=True)))
    overall_rate = (overall.get("aprobados") or 0) / overall.get("total") if overall.get("total") else 0

    return {
        "overall": {"total": overall.get("total", 0), "aprobados": overall.get("aprobados", 0), "rate": float(overall_rate)},
        "aprobacion_por_tipo": aprobacion,
    }


@router.get("/dropout", response=dict)
@require_authenticated_group
def analytics_dropout(request, programa_id: int = None, cohorte_id: int = None, date_from: str = None, date_to: str = None, rule: str = "A", lookback_weeks: int = 3):
    rule = (rule or "A").upper()
    qs = Inscripcion.objects.select_related("estudiante", "cohorte__programa")
    if programa_id:
        qs = qs.filter(cohorte__programa_id=programa_id)
    if cohorte_id:
        qs = qs.filter(cohorte_id=cohorte_id)
    if date_from:
        df = parse_date(date_from)
        if df:
            qs = qs.filter(created_at__date__gte=df)
    if date_to:
        dt = parse_date(date_to)
        if dt:
            qs = qs.filter(created_at__date__lte=dt)

    total_insc = qs.count()
    if rule == "B":
        threshold = (parse_date(date_to) or None)
        if threshold is None:
            from django.utils import timezone
            threshold = timezone.now().date()
        threshold = threshold - timedelta(weeks=lookback_weeks)
        active_student_ids = (
            Asistencia.objects.filter(fecha__gte=threshold, estudiante_id__in=qs.values_list("estudiante_id", flat=True))
            .values_list("estudiante_id", flat=True)
            .distinct()
        )
        risk_ids = set(qs.values_list("estudiante_id", flat=True)) - set(active_student_ids)
        dropout_count = len(risk_ids)
        rate = (dropout_count / total_insc) if total_insc else 0
        risk_students = list(Estudiante.objects.filter(id__in=risk_ids).values("id", "apellido", "nombre", "dni")[:50])
        return {
            "rule": "B",
            "lookback_weeks": lookback_weeks,
            "overall": {"total_inscripciones": total_insc, "dropout": dropout_count, "rate": float(rate)},
            "at_risk": risk_students,
            "series": [],
        }

    bajas_ids = set(qs.filter(estudiante__estatus="Baja").values_list("id", flat=True))
    pausado_ids = set(qs.filter(estado="PAUSADO").values_list("id", flat=True))
    dropout_ids = bajas_ids.union(pausado_ids)
    dropout_count = len(dropout_ids)
    rate = (dropout_count / total_insc) if total_insc else 0

    bajas_series = (
        qs.filter(estudiante__estatus="Baja")
        .annotate(period=TruncMonth("estudiante__updated_at"))
        .values("period")
        .annotate(count=Count("id"))
    )
    pausado_series = (
        qs.filter(estado="PAUSADO").annotate(period=TruncMonth("updated_at")).values("period").annotate(count=Count("id"))
    )
    by_period = {}
    for item in bajas_series:
        if item["period"]:
            key = item["period"].date().isoformat()
            by_period[key] = by_period.get(key, 0) + item["count"]
    for item in pausado_series:
        if item["period"]:
            key = item["period"].date().isoformat()
            by_period[key] = by_period.get(key, 0) + item["count"]
    series = [{"period": k, "count": v} for k, v in sorted(by_period.items())]

    return {
        "rule": "A",
        "overall": {"total_inscripciones": total_insc, "dropout": dropout_count, "rate": float(rate)},
        "series": series,
    }


@router.get("/graduates", response=dict)
@require_authenticated_group
def analytics_graduates(request, programa_id: int = None, cohorte_id: int = None):
    if not programa_id and not cohorte_id:
        return {"detail": "'programa_id' o 'cohorte_id' requerido"}, 400

    programa = None
    if cohorte_id and not programa_id:
        try:
            coh = Cohorte.objects.select_related("programa").get(id=cohorte_id)
            programa = coh.programa
            programa_id = programa.id
        except Cohorte.DoesNotExist:
            return {"detail": "Cohorte no encontrado"}, 404
    if programa is None and programa_id:
        try:
            programa = Cohorte.objects.filter(programa_id=programa_id).first()
        except Cohorte.DoesNotExist:
            programa = None

    bloques_req = list(Bloque.objects.filter(programa_id=programa_id).values_list("id", flat=True))
    total_bloques = len(bloques_req)

    if cohorte_id:
        estudiantes_qs = Estudiante.objects.filter(inscripciones__cohorte_id=cohorte_id)
    else:
        estudiantes_qs = Estudiante.objects.filter(inscripciones__cohorte__programa_id=programa_id)
    estudiantes_qs = estudiantes_qs.distinct()
    total_estudiantes = estudiantes_qs.count()

    graduates_ids = []
    if total_bloques > 0 and total_estudiantes > 0:
        finals_types = [Examen.FINAL_VIRTUAL, Examen.FINAL_SINC, Examen.EQUIVALENCIA]
        aprobados_por_est = (
            Nota.objects.filter(
                aprobado=True,
                examen__tipo_examen__in=finals_types,
                examen__bloque_id__in=bloques_req,
                estudiante__in=estudiantes_qs,
            )
            .values("estudiante_id")
            .annotate(bloques_aprobados=Count("examen__bloque", distinct=True))
        )
        graduates_ids = [r["estudiante_id"] for r in aprobados_por_est if r["bloques_aprobados"] >= total_bloques]

    graduates_count = len(graduates_ids) if total_bloques > 0 else 0
    rate = (graduates_count / total_estudiantes) if total_estudiantes else 0
    grads = list(
        Estudiante.objects.filter(id__in=graduates_ids).values("id", "apellido", "nombre", "dni")[:100]
    )

    return {
        "programa_id": programa_id,
        "cohorte_id": cohorte_id,
        "overall": {
            "total_estudiantes": total_estudiantes,
            "total_bloques_requeridos": total_bloques,
            "graduados": graduates_count,
            "rate": float(rate),
        },
        "graduados": grads,
    }


@router.get("/courses-graph", response=dict)
@require_authenticated_group
def courses_graph(request, programa_id: int, cohorte_id: int = None):
    try:
        programa = Cohorte.objects.filter(programa_id=programa_id).first().programa
    except Exception:
        programa = None
    try:
        from core.models import Programa as ProgramaModel
        programa = ProgramaModel.objects.get(id=programa_id)
    except Exception:
        if programa is None:
            return {"detail": "Programa no encontrado"}, 404

    bloques = (
        Bloque.objects.filter(programa=programa)
        .order_by("orden", "id")
        .prefetch_related("modulos")
    )
    tree = []
    for blo in bloques:
        blo_node = {"type": "bloque", "id": blo.id, "nombre": blo.nombre, "orden": blo.orden, "children": []}
        for mod in blo.modulos.all().order_by("orden", "id"):
            blo_node["children"].append(
                {
                    "type": "modulo",
                    "id": mod.id,
                    "nombre": mod.nombre,
                    "orden": mod.orden,
                    "es_practica": mod.es_practica,
                    "fecha_inicio": mod.fecha_inicio.isoformat() if mod.fecha_inicio else None,
                    "fecha_fin": mod.fecha_fin.isoformat() if mod.fecha_fin else None,
                }
            )
        finales_qs = Examen.objects.filter(
            bloque=blo, tipo_examen__in=[Examen.FINAL_VIRTUAL, Examen.FINAL_SINC, Examen.EQUIVALENCIA]
        ).order_by("fecha", "id")
        blo_node["finales"] = [
            {"id": ex.id, "tipo_examen": ex.tipo_examen, "fecha": ex.fecha.isoformat() if ex.fecha else None, "peso": float(ex.peso)}
            for ex in finales_qs
        ]
        tree.append(blo_node)

    cohorte_data = None
    if cohorte_id:
        try:
            coh = Cohorte.objects.select_related("programa", "bloque_fechas").get(id=cohorte_id)
            cohorte_data = {
                "id": coh.id,
                "nombre": coh.nombre,
                "programa_id": coh.programa_id,
                "bloque_fechas_id": coh.bloque_fechas_id,
                "bloque_fechas_nombre": coh.bloque_fechas.nombre,
            }
        except Cohorte.DoesNotExist:
            cohorte_data = None

    return {
        "programa": {"id": programa.id, "codigo": programa.codigo, "nombre": programa.nombre},
        "cohorte": cohorte_data,
        "tree": tree,
    }
