from datetime import timedelta
from django.db.models import Avg, Count, Exists, OuterRef, Q
from django.db.models.functions import TruncMonth, TruncWeek
from django.utils.dateparse import parse_date
from ninja import Router
from ninja.errors import HttpError
from core.api.permissions import require_authenticated_group

from core.models import Inscripcion, Asistencia, Nota, Estudiante, Cohorte, Bloque, Examen, Programa

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
def analytics_enrollments(
    request,
    programa_id: int = None,
    bloque_id: int = None,
    cohorte_id: int = None,
    date_from: str = None,
    date_to: str = None,
    group_by: str = "month",
):
    qs = Inscripcion.objects.all()
    if programa_id:
        qs = qs.filter(cohorte__programa_id=programa_id)
    if bloque_id:
        qs = qs.filter(modulo__bloque_id=bloque_id)
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
def analytics_graduates(request, programa_id: int = None, bloque_id: int = None, cohorte_id: int = None):
    programa = None
    if cohorte_id and not programa_id:
        try:
            coh = Cohorte.objects.select_related("programa").get(id=cohorte_id)
            programa = coh.programa
            programa_id = programa.id
        except Cohorte.DoesNotExist:
            raise HttpError(404, "Cohorte no encontrado")

    if programa_id and programa is None:
        try:
            programa = Programa.objects.get(id=programa_id)
        except Programa.DoesNotExist:
            raise HttpError(404, "Programa no encontrado")

    inscripciones_qs = Inscripcion.objects.all()
    if programa_id:
        inscripciones_qs = inscripciones_qs.filter(cohorte__programa_id=programa_id)
    if cohorte_id:
        inscripciones_qs = inscripciones_qs.filter(cohorte_id=cohorte_id)
    if bloque_id:
        inscripciones_qs = inscripciones_qs.filter(modulo__bloque_id=bloque_id)

    estudiantes_qs = Estudiante.objects.filter(inscripciones__id__in=inscripciones_qs.values_list("id", flat=True)).distinct()
    total_estudiantes = estudiantes_qs.count()

    if bloque_id:
        bloques_req = [bloque_id]
    elif programa_id:
        bloques_req = list(Bloque.objects.filter(programa_id=programa_id).values_list("id", flat=True))
    else:
        bloques_req = []
    total_bloques = len(bloques_req)
    graduates_ids = []
    if bloque_id and total_estudiantes > 0:
        finals_types = [Examen.FINAL_VIRTUAL, Examen.FINAL_SINC, Examen.EQUIVALENCIA]
        aprobados_ids = (
            Nota.objects.filter(
                aprobado=True,
                examen__tipo_examen__in=finals_types,
                examen__bloque_id=bloque_id,
                estudiante__in=estudiantes_qs,
            )
            .values_list("estudiante_id", flat=True)
            .distinct()
        )
        graduates_ids = list(aprobados_ids)
    elif programa_id and len(bloques_req) > 0 and total_estudiantes > 0:
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
    else:
        graduates_ids = list(
            inscripciones_qs.filter(estado=Inscripcion.EGRESADO).values_list("estudiante_id", flat=True).distinct()
        )

    graduates_count = len(graduates_ids)
    rate = (graduates_count / total_estudiantes) if total_estudiantes else 0
    grads = list(
        Estudiante.objects.filter(id__in=graduates_ids).values("id", "apellido", "nombre", "dni")[:100]
    )

    return {
        "programa_id": programa_id,
        "bloque_id": bloque_id,
        "cohorte_id": cohorte_id,
        "programa": {"id": programa.id, "nombre": programa.nombre} if programa else None,
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
def courses_graph(
    request,
    programa_id: int,
    bloque_id: int = None,
    cohorte_id: int = None,
    anio: int = None,
):
    try:
        programa = Programa.objects.get(id=programa_id)
    except Programa.DoesNotExist:
        raise HttpError(404, "Programa no encontrado")

    cohortes_qs = (
        Cohorte.objects.filter(programa=programa)
        .select_related("bloque_fechas")
        .prefetch_related("bloque_fechas__semanas_config")
        .annotate(
            estudiantes_total=Count("inscripciones__estudiante_id", distinct=True),
            estatus_regular=Count(
                "inscripciones__estudiante_id",
                filter=Q(inscripciones__estudiante__estatus="Regular"),
                distinct=True,
            ),
            estatus_libre=Count(
                "inscripciones__estudiante_id",
                filter=Q(inscripciones__estudiante__estatus="Libre"),
                distinct=True,
            ),
            estatus_baja=Count(
                "inscripciones__estudiante_id",
                filter=Q(inscripciones__estudiante__estatus="Baja"),
                distinct=True,
            ),
            estado_inscripto=Count(
                "inscripciones__estudiante_id",
                filter=Q(inscripciones__estado=Inscripcion.PREINSCRIPTO),
            ),
            Total_Activos=Count(
                "inscripciones",
                filter=Q(inscripciones__estado=Inscripcion.CURSANDO),
                distinct=True,
            ),
            estado_pausado=Count(
                "inscripciones__estudiante_id",
                filter=Q(inscripciones__estado=Inscripcion.PAUSADO),
                distinct=True,
            ),
            estado_egresado=Count(
                "inscripciones__estudiante_id",
                filter=Q(inscripciones__estado=Inscripcion.EGRESADO),
                distinct=True,
            ),
        )
        .order_by("fecha_inicio", "id")
    )
    if bloque_id:
        cohortes_qs = cohortes_qs.filter(bloque_id=bloque_id)
    if anio:
        cohortes_qs = cohortes_qs.filter(fecha_inicio__year=anio)

    cohortes_data = []
    for coh in cohortes_qs:
        semanas = sorted(coh.bloque_fechas.semanas_config.all(), key=lambda s: s.orden)
        tipos = {}
        for s in semanas:
            tipos[s.tipo] = tipos.get(s.tipo, 0) + 1
        cohortes_data.append(
            {
                "id": coh.id,
                "nombre": coh.nombre,
                "fecha_inicio": coh.fecha_inicio.isoformat() if coh.fecha_inicio else None,
                "fecha_fin": coh.fecha_fin.isoformat() if coh.fecha_fin else None,
                "bloque_fechas_id": coh.bloque_fechas_id,
                "bloque_fechas_nombre": coh.bloque_fechas.nombre,
                "bloque_fechas_descripcion": coh.bloque_fechas.descripcion,
                "total_semanas": len(semanas),
                "tipos_semana": tipos,
                "estudiantes_total": coh.estudiantes_total,
                "estatus_regular": coh.estatus_regular,
                "estatus_libre": coh.estatus_libre,
                "estatus_baja": coh.estatus_baja,
                "estado_inscripto": coh.estado_inscripto,
                "estado_activo": coh.estado_activo,
                "estado_pausado": coh.estado_pausado,
                "estado_egresado": coh.estado_egresado,
            }
        )

    bloques_qs = Bloque.objects.filter(programa=programa)
    if bloque_id:
        bloques_qs = bloques_qs.filter(id=bloque_id)
    bloques = bloques_qs.order_by("id").prefetch_related("modulos")
    tree = []
    for blo in bloques:
        blo_node = {"type": "bloque", "id": blo.id, "nombre": blo.nombre, "children": []}
        for mod in blo.modulos.all().order_by("id"):
            blo_node["children"].append(
                {
                    "type": "modulo",
                    "id": mod.id,
                    "nombre": mod.nombre,
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
            coh_qs = Cohorte.objects.select_related("programa", "bloque_fechas").prefetch_related("bloque_fechas__semanas_config").filter(
                id=cohorte_id, programa_id=programa_id
            )
            if bloque_id:
                coh_qs = coh_qs.filter(bloque_id=bloque_id)
            if anio:
                coh_qs = coh_qs.filter(fecha_inicio__year=anio)
            coh = coh_qs.get()
            semanas = sorted(coh.bloque_fechas.semanas_config.all(), key=lambda s: s.orden)
            secuencia = []
            for semana in semanas:
                fecha_semana = None
                if coh.fecha_inicio:
                    fecha_semana = (coh.fecha_inicio + timedelta(days=(semana.orden - 1) * 7)).isoformat()
                secuencia.append(
                    {
                        "orden": semana.orden,
                        "tipo": semana.tipo,
                        "tipo_label": semana.get_tipo_display(),
                        "fecha": fecha_semana,
                    }
                )

            cohorte_stats = next((c for c in cohortes_data if c["id"] == coh.id), None)
            cohorte_data = {
                "id": coh.id,
                "nombre": coh.nombre,
                "programa_id": coh.programa_id,
                "fecha_inicio": coh.fecha_inicio.isoformat() if coh.fecha_inicio else None,
                "fecha_fin": coh.fecha_fin.isoformat() if coh.fecha_fin else None,
                "bloque_fechas_id": coh.bloque_fechas_id,
                "bloque_fechas_nombre": coh.bloque_fechas.nombre,
                "bloque_fechas_descripcion": coh.bloque_fechas.descripcion,
                "secuencia": secuencia,
                "stats": cohorte_stats,
            }
        except Cohorte.DoesNotExist:
            raise HttpError(404, "Cohorte no encontrada para el programa seleccionado")

    return {
        "programa": {"id": programa.id, "codigo": programa.codigo, "nombre": programa.nombre},
        "bloque_id": bloque_id,
        "cohorte_id": cohorte_id,
        "anio": anio,
        "cohortes": cohortes_data,
        "cohorte": cohorte_data,
        "tree": tree,
    }
