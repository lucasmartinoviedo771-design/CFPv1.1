import re
import math
import unicodedata
from datetime import date
from collections import defaultdict
from django.db.models import Avg, Count, Q
from ninja import Router
from core.api.permissions import require_authenticated_group
from core.models import Asistencia, Estudiante, Inscripcion, Nota, Programa, Cohorte, Bloque
from core.utils.estudiante_normalization import normalize_ciudad

router = Router(tags=["dashboard"])

MESES_LIST = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
]
MESES_DICT = {i: name for i, name in enumerate(MESES_LIST, 1)}

SPECIAL_PROGRAMS = [
    "habilidades digitales",
    "sistemas de representacion",
    "matematica para tecnicos",
    "diseno y fabricacion digital",
    "tecnicatura superior en ciencia de datos",
]

def _norm(texto):
    if not texto:
        return ""
    nfkd = unicodedata.normalize("NFKD", str(texto))
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower().strip()


@router.get("/dashboard-stats", response=dict)
@require_authenticated_group
def dashboard_stats(
    request,
    programa_id: int = None,
    programa: str = None,
    bloque_id: int = None,
    bloque: str = None,
    cohorte_id: int = None,
    cohorte: str = None,
    year: str = None,
    month: str = None,
    modulo: str = None,
    localidad: str = None,
    nivel_educativo: str = None,
    estado: str = None,
    fecha_desde: date = None,
    fecha_hasta: date = None,
    search: str = None,
    page: int = 1,
    page_size: int = 50,
):
    # -------------------------------------------------------------------------
    # 1. Consulta base de Inscripciones con relaciones precargadas
    # -------------------------------------------------------------------------
    inscripciones_qs = (
        Inscripcion.objects.select_related(
            "estudiante",
            "cohorte",
            "cohorte__programa",
            "cohorte__bloque",
            "modulo",
            "modulo__bloque",
        ).order_by(
            "-cohorte__fecha_inicio",
            "estudiante__apellido",
            "estudiante__nombre",
            "id",
        )
    )

    all_inscriptions = list(inscripciones_qs)
    student_ids = {ins.estudiante_id for ins in all_inscriptions}

    # -------------------------------------------------------------------------
    # 2. Historial de notas y evaluaciones (Módulo, Bloque, Articulados)
    #    Reproduce exactamente la lógica de exportar_reporte_estudiantes
    # -------------------------------------------------------------------------
    notas_qs = (
        Nota.objects.filter(estudiante_id__in=student_ids)
        .select_related("examen", "examen__modulo", "examen__bloque")
        .order_by("fecha_calificacion", "id")
    )

    notas_modulo_map = {}
    notas_modulo_nombre_map = {}
    notas_bloque_map = {}
    notas_bloque_nombre_map = {}

    for n in notas_qs:
        fecha_rendida = (
            n.fecha_calificacion.date()
            if n.fecha_calificacion
            else (n.created_at.date() if n.created_at else None)
        )
        calif_val = float(n.calificacion) if n.calificacion is not None else None
        tipo_label = n.examen.get_tipo_examen_display() if n.examen else ""
        nota_info = {
            "id": n.id,
            "nota": calif_val,
            "aprobado": n.aprobado,
            "fecha": fecha_rendida,
            "tipo_examen": tipo_label,
            "tipo_raw": n.examen.tipo_examen if n.examen else "",
            "es_definitiva": n.es_nota_definitiva,
        }

        if n.examen and n.examen.modulo_id:
            key_mod = (n.estudiante_id, n.examen.modulo_id)
            notas_modulo_map.setdefault(key_mod, []).append(nota_info)
            if n.examen.modulo and n.examen.modulo.bloque_id:
                b_norm = _norm(n.examen.modulo.bloque.nombre)
                m_norm = _norm(n.examen.modulo.nombre)
                notas_modulo_nombre_map.setdefault((n.estudiante_id, b_norm, m_norm), []).append(nota_info)
                if "habilidad" in b_norm or "hab.dig" in b_norm or "digital" in b_norm:
                    notas_modulo_nombre_map.setdefault((n.estudiante_id, "hab_dig_generico", m_norm), []).append(nota_info)
        elif n.examen and n.examen.bloque_id:
            key_blq = (n.estudiante_id, n.examen.bloque_id)
            notas_bloque_map.setdefault(key_blq, []).append(nota_info)
            b_norm = _norm(n.examen.bloque.nombre)
            notas_bloque_nombre_map.setdefault((n.estudiante_id, b_norm), []).append(nota_info)
            if "habilidad" in b_norm or "hab.dig" in b_norm or "digital" in b_norm:
                notas_bloque_nombre_map.setdefault((n.estudiante_id, "hab_dig_generico"), []).append(nota_info)

    # -------------------------------------------------------------------------
    # 3. Construcción de registros y mapeo de notas candidatas
    # -------------------------------------------------------------------------
    dict_estados_inscripcion = dict(Inscripcion.ESTADOS)
    first_entry_by_person = {}

    raw_rows = []
    for ins in all_inscriptions:
        est = ins.estudiante
        ins_cohorte = ins.cohorte
        ins_programa = ins_cohorte.programa if ins_cohorte else None
        ins_modulo = ins.modulo
        ins_bloque = ins_modulo.bloque if (ins_modulo and ins_modulo.bloque) else (ins_cohorte.bloque if ins_cohorte else None)

        estado_cursada_raw = ins.estado or Inscripcion.PREINSCRIPTO
        estado_cursada_display = dict_estados_inscripcion.get(
            estado_cursada_raw, estado_cursada_raw.capitalize()
        )

        notas_candidatas = []
        if ins_modulo:
            for n_mod in notas_modulo_map.get((est.id, ins_modulo.id), []):
                if n_mod not in notas_candidatas:
                    notas_candidatas.append(n_mod)
            if not notas_candidatas and ins_modulo.bloque:
                b_norm = _norm(ins_modulo.bloque.nombre)
                m_norm = _norm(ins_modulo.nombre)
                for n_mod in notas_modulo_nombre_map.get((est.id, b_norm, m_norm), []):
                    if n_mod not in notas_candidatas:
                        notas_candidatas.append(n_mod)
                if not notas_candidatas and ("habilidad" in b_norm or "hab.dig" in b_norm or "digital" in b_norm):
                    for n_mod in notas_modulo_nombre_map.get((est.id, "hab_dig_generico", m_norm), []):
                        if n_mod not in notas_candidatas:
                            notas_candidatas.append(n_mod)

            m_norm = _norm(ins_modulo.nombre) if ins_modulo.nombre else ""
            es_primer_modulo = ("modulo 1" in m_norm or "etapa 1" in m_norm) and not ("modulo 2" in m_norm or "etapa 2" in m_norm)
            if not es_primer_modulo and estado_cursada_raw not in [
                Inscripcion.CURSANDO, Inscripcion.PREINSCRIPTO, Inscripcion.INACTIVO, Inscripcion.LIBRE
            ]:
                if ins_modulo.bloque_id:
                    for nb in notas_bloque_map.get((est.id, ins_modulo.bloque_id), []):
                        if nb not in notas_candidatas:
                            notas_candidatas.append(nb)
                if ins_cohorte and ins_cohorte.bloque_id:
                    for nb in notas_bloque_map.get((est.id, ins_cohorte.bloque_id), []):
                        if nb not in notas_candidatas:
                            notas_candidatas.append(nb)
                b_norm = _norm(ins_modulo.bloque.nombre) if ins_modulo.bloque else ""
                if "habilidad" in b_norm or "hab.dig" in b_norm or "digital" in b_norm:
                    for nb in notas_bloque_nombre_map.get((est.id, "hab_dig_generico"), []):
                        if nb not in notas_candidatas:
                            notas_candidatas.append(nb)
        elif ins_bloque:
            for nb in notas_bloque_map.get((est.id, ins_bloque.id), []):
                if nb not in notas_candidatas:
                    notas_candidatas.append(nb)

        notas_a_emitir = notas_candidatas if notas_candidatas else [{"nota": None, "fecha": None}]

        dni_clean = re.sub(r"[.\s-]", "", str(est.dni or ""))
        name_norm = _norm(f"{est.apellido} {est.nombre}")
        person_id = f"d:{dni_clean}" if dni_clean else (f"n:{name_norm}" if name_norm else f"id:{est.id}")
        p_name = ins_programa.nombre if ins_programa else "Sin Programa"
        p_id = ins_programa.id if ins_programa else 0
        key = f"{person_id}|{_norm(p_name)}"

        cohorte_name = ins_cohorte.nombre if ins_cohorte else "Sin Cohorte"
        bloque_name = ins_bloque.nombre if ins_bloque else "Sin Bloque"
        modulo_name = ins_modulo.nombre if ins_modulo else "General"
        city_norm = normalize_ciudad(est.ciudad) or "Sin información"

        # Detección de año
        cohort_year_match = re.search(r"(?:19|20)\d{2}", cohorte_name)
        if cohort_year_match:
            year_val = cohort_year_match.group(0)
        elif ins_cohorte and ins_cohorte.fecha_inicio:
            year_val = str(ins_cohorte.fecha_inicio.year)
        elif ins.created_at:
            year_val = str(ins.created_at.year)
        else:
            year_val = "Sin año"

        # Detección de mes
        if ins_cohorte and ins_cohorte.fecha_inicio:
            month_val = MESES_DICT.get(ins_cohorte.fecha_inicio.month, "Sin mes")
        elif ins.created_at:
            month_val = MESES_DICT.get(ins.created_at.month, "Sin mes")
        else:
            month_val = "Sin mes"

        # Actualizar fecha de primer ingreso por persona
        first_date_cand = (
            ins_cohorte.fecha_inicio.strftime("%Y-%m-%d") if (ins_cohorte and ins_cohorte.fecha_inicio)
            else (ins.created_at.strftime("%Y-%m-%d") if ins.created_at else "")
        )
        if first_date_cand:
            if person_id not in first_entry_by_person or first_date_cand < first_entry_by_person[person_id]:
                first_entry_by_person[person_id] = first_date_cand

        m_name = ins_modulo.nombre if ins_modulo else ""
        m1 = bool(re.search(r"\bmodulo\s*1\b", _norm(m_name)))
        m2 = bool(re.search(r"\bmodulo\s*2\b", _norm(m_name)))

        for nd in notas_a_emitir:
            has_grade = nd.get("nota") is not None
            grade_str = f"{nd['nota']:.2f}" if has_grade else ""
            grade_date_str = nd["fecha"].strftime("%Y-%m-%d") if nd.get("fecha") else ""

            raw_rows.append({
                "id": ins.id,
                "person_id": person_id,
                "name": f"{est.apellido}, {est.nombre}",
                "dni": est.dni or "",
                "city": city_norm,
                "education": est.nivel_educativo or "Sin información",
                "regular": est.estatus or "Regular",
                "is_active": est.is_active,
                "program": p_name,
                "program_id": p_id,
                "bloque_id": ins_bloque.id if ins_bloque else 0,
                "cohorte_id": ins_cohorte.id if ins_cohorte else 0,
                "block": bloque_name,
                "module": modulo_name,
                "cohort": cohorte_name,
                "year": year_val,
                "month": month_val,
                "state": estado_cursada_display,
                "m1": m1,
                "m2": m2,
                "hasGrade": has_grade,
                "grade": grade_str,
                "qualified": grade_date_str,
                "key": key,
                "enroll": "",
                "cohorte_fecha_inicio": ins_cohorte.fecha_inicio if ins_cohorte else None,
                "created_at_date": ins.created_at.date() if ins.created_at else None,
            })

    # Asignar primer ingreso a cada fila
    for r in raw_rows:
        r["enroll"] = first_entry_by_person.get(r["person_id"], "")

    # -------------------------------------------------------------------------
    # 4. Agrupación por (persona + programa) para determinar estatus sin duplicar
    #    (Regla exacta del Observatorio de estudiantes)
    # -------------------------------------------------------------------------
    programa_bloques_map = {}
    for p in Programa.objects.prefetch_related("bloques").all():
        b_ids = set(p.bloques.values_list("id", flat=True))
        if b_ids:
            programa_bloques_map[p.id] = b_ids

    groups = {}
    for r in raw_rows:
        g = groups.setdefault(
            r["key"],
            {
                "explicit": False,
                "m1": False,
                "m2": False,
                "approved_blocks": set(),
            },
        )
        if _norm(r["state"]) == "egresado" or _norm(r["regular"]) == "egresado":
            g["explicit"] = True

        # Si la inscripción está aprobada o egresada, sumar al conjunto de bloques aprobados
        if _norm(r["state"]) in ["aprobado", "egresado"]:
            if r["bloque_id"]:
                g["approved_blocks"].add(r["bloque_id"])

        if r["m1"] and r["hasGrade"]:
            g["m1"] = True
        if r["m2"] and r["hasGrade"]:
            g["m2"] = True
            if r["bloque_id"]:
                g["approved_blocks"].add(r["bloque_id"])

    for r in raw_rows:
        g = groups[r["key"]]
        p_id = r["program_id"]
        req_blocks = programa_bloques_map.get(p_id, set())
        is_multi_block = len(req_blocks) > 1

        if is_multi_block:
            # Programa con más de un bloque (ej: Programador de Nivel III, Videojuegos)
            # Regla: Solo es Egresado si tiene TODOS los bloques del programa aprobados Y acreditación de egreso
            total_req = len(req_blocks)
            approved_count = len(g["approved_blocks"].intersection(req_blocks))

            if approved_count >= total_req and total_req > 0 and g["explicit"]:
                r["status"] = "Egresado"
                r["reason"] = f"Completó {total_req} de {total_req} bloques (Egresado)"
            elif approved_count > 0:
                r["status"] = "En curso con materias aprobadas"
                r["reason"] = f"Aprobó {approved_count} de {total_req} bloques (En curso)"
            else:
                r["status"] = "Sin egreso acreditado"
                r["reason"] = "Sin bloques aprobados"
        else:
            # Programa de un solo bloque (aprobado = egresado)
            is_sp = any(_norm(r["program"]).startswith(s) for s in SPECIAL_PROGRAMS)
            if g["explicit"] or (is_sp and g["m2"]):
                r["status"] = "Egresado"
                r["reason"] = "Egresado declarado" if g["explicit"] else "Nota en módulo 2"
            elif is_sp and g["m1"] and not g["m2"]:
                r["status"] = "En curso con materias aprobadas"
                r["reason"] = "Nota solo en módulo 1"
            else:
                r["status"] = "Sin egreso acreditado"
                r["reason"] = "Sin evidencia de egreso"

    # -------------------------------------------------------------------------
    # 5. Aplicación de Filtros
    # -------------------------------------------------------------------------
    filtered_rows = []
    for r in raw_rows:
        if programa_id and r["program_id"] != programa_id:
            continue
        if programa and _norm(r["program"]) != _norm(programa):
            continue
        if bloque_id and r["bloque_id"] != bloque_id:
            continue
        if bloque and _norm(r["block"]) != _norm(bloque):
            continue
        if cohorte_id and r["cohorte_id"] != cohorte_id:
            continue
        if cohorte and _norm(r["cohort"]) != _norm(cohorte):
            continue
        if year and str(r["year"]) != str(year):
            continue
        if month and _norm(r["month"]) != _norm(month):
            continue
        if modulo and _norm(r["module"]) != _norm(modulo):
            continue
        if localidad and _norm(r["city"]) != _norm(localidad):
            continue
        if nivel_educativo and _norm(r["education"]) != _norm(nivel_educativo):
            continue
        if estado and _norm(r["status"]) != _norm(estado):
            continue
        if fecha_desde:
            f_ref = r["cohorte_fecha_inicio"] or r["created_at_date"]
            if not f_ref or f_ref < fecha_desde:
                continue
        if fecha_hasta:
            f_ref = r["cohorte_fecha_inicio"] or r["created_at_date"]
            if not f_ref or f_ref > fecha_hasta:
                continue
        if search:
            s_low = _norm(search)
            combined_search = _norm(f"{r['name']} {r['dni']} {r['cohort']} {r['module']} {r['program']} {r['year']} {r['month']}")
            if s_low not in combined_search:
                continue
        filtered_rows.append(r)

    # -------------------------------------------------------------------------
    # 6. KPIs Exactos (Sin contar 2 veces a la misma persona en el mismo curso)
    # -------------------------------------------------------------------------
    unique_students_count = len(set(r["person_id"] for r in filtered_rows))
    graduated_students_count = len(set(r["person_id"] for r in filtered_rows if r["status"] == "Egresado"))
    program_graduations_count = len(set(r["key"] for r in filtered_rows if r["status"] == "Egresado"))
    in_course_students_count = len(set(r["person_id"] for r in filtered_rows if r["status"] == "En curso con materias aprobadas"))
    total_records = len(filtered_rows)

    active_person_ids = {
        r["person_id"] for r in filtered_rows
        if r["is_active"] and _norm(r["regular"]) != "baja"
    }
    active_students_count = len(active_person_ids)

    # -------------------------------------------------------------------------
    # 7. Distribuciones Agregadas (Alumnos únicos por categoría)
    # -------------------------------------------------------------------------
    def _count_unique_by(field_name: str) -> list:
        group_map = defaultdict(set)
        for r in filtered_rows:
            group_map[r[field_name]].add(r["person_id"])
        return [{"name": k, "count": len(v)} for k, v in group_map.items()]

    by_year_raw = _count_unique_by("year")
    by_year = sorted(by_year_raw, key=lambda x: str(x["name"]))

    by_program_raw = _count_unique_by("program")
    by_program = sorted(by_program_raw, key=lambda x: x["count"], reverse=True)

    by_status_raw = _count_unique_by("status")
    by_status = sorted(by_status_raw, key=lambda x: x["count"], reverse=True)

    by_block_raw = _count_unique_by("block")
    by_block = sorted(by_block_raw, key=lambda x: x["count"], reverse=True)

    by_cohort_raw = _count_unique_by("cohort")
    by_cohort = sorted(by_cohort_raw, key=lambda x: x["count"], reverse=True)

    by_city_raw = _count_unique_by("city")
    by_city = sorted(by_city_raw, key=lambda x: x["count"], reverse=True)

    by_education_raw = _count_unique_by("education")
    by_education = sorted(by_education_raw, key=lambda x: x["count"], reverse=True)

    # Meses en orden cronológico del calendario
    by_month_map = defaultdict(set)
    for r in filtered_rows:
        by_month_map[r["month"]].add(r["person_id"])
    by_month = []
    for m in MESES_LIST:
        if m in by_month_map:
            by_month.append({"name": m, "count": len(by_month_map[m])})
    if "Sin mes" in by_month_map:
        by_month.append({"name": "Sin mes", "count": len(by_month_map["Sin mes"])})

    # -------------------------------------------------------------------------
    # 8. Matrices Históricas
    # -------------------------------------------------------------------------
    # Primer ingreso histórico por persona
    first_year_map = defaultdict(set)
    for r in filtered_rows:
        p_id = r["person_id"]
        enroll_date = r["enroll"]
        year_f = enroll_date[:4] if enroll_date and len(enroll_date) >= 4 and enroll_date[:4].isdigit() else "Sin fecha"
        first_year_map[year_f].add(p_id)

    first_entries = sorted(
        [{"year": y, "count": len(s)} for y, s in first_year_map.items()],
        key=lambda x: str(x["year"]),
    )

    # Matriz cruzada Año x Programa
    cross_map = defaultdict(lambda: {"all": set(), "grad": set()})
    for r in filtered_rows:
        ckey = (r["year"], r["program"])
        cross_map[ckey]["all"].add(r["person_id"])
        if r["status"] == "Egresado":
            cross_map[ckey]["grad"].add(r["person_id"])

    cross_matrix = [
        {
            "year": y,
            "program": p,
            "unique_students": len(data["all"]),
            "graduated": len(data["grad"]),
        }
        for (y, p), data in cross_map.items()
    ]
    cross_matrix.sort(key=lambda x: (str(x["year"]), str(x["program"])))

    # -------------------------------------------------------------------------
    # 9. Asistencia y Aprobación
    # -------------------------------------------------------------------------
    scoped_est_ids = {r["person_id"] for r in filtered_rows}
    # Obtener IDs enteros de estudiantes filtrados
    est_int_ids = {ins.estudiante_id for ins in all_inscriptions}

    attendance_qs = Asistencia.objects.filter(estudiante_id__in=est_int_ids)
    if bloque_id:
        attendance_qs = attendance_qs.filter(modulo__bloque_id=bloque_id)
    if fecha_desde:
        attendance_qs = attendance_qs.filter(fecha__gte=fecha_desde)
    if fecha_hasta:
        attendance_qs = attendance_qs.filter(fecha__lte=fecha_hasta)

    att_agg = attendance_qs.aggregate(total=Count("id"), present=Count("id", filter=Q(presente=True)))
    total_att = att_agg["total"] or 0
    present_att = att_agg["present"] or 0
    attendance_rate = (present_att / total_att * 100) if total_att > 0 else 0

    pass_rate = (graduated_students_count / unique_students_count * 100) if unique_students_count > 0 else 0

    # -------------------------------------------------------------------------
    # 10. Paginación de Registros Auditables
    # -------------------------------------------------------------------------
    page_size = max(1, min(page_size, 500))
    total_pages = max(1, math.ceil(total_records / page_size))
    current_page = max(1, min(page, total_pages))

    start_idx = (current_page - 1) * page_size
    end_idx = start_idx + page_size
    paged_items = filtered_rows[start_idx:end_idx]

    # Limpiar campos internos antes de serializar
    cleaned_items = []
    for item in paged_items:
        cleaned_items.append({
            "id": item["id"],
            "person_id": item["person_id"],
            "name": item["name"],
            "dni": item["dni"],
            "city": item["city"],
            "education": item["education"],
            "regular": item["regular"],
            "is_active": item["is_active"],
            "program": item["program"],
            "program_id": item["program_id"],
            "block": item["block"],
            "module": item["module"],
            "cohort": item["cohort"],
            "year": item["year"],
            "month": item["month"],
            "state": item["state"],
            "status": item["status"],
            "reason": item["reason"],
            "enroll": item["enroll"],
            "grade": item["grade"],
            "qualified": item["qualified"],
        })

    # Retrocompatibilidad
    active_details = {}
    for r in filtered_rows:
        if r["is_active"] and _norm(r["regular"]) != "baja":
            p = r["program"]
            c = r["cohort"]
            if p not in active_details:
                active_details[p] = {"name": p, "count": 0, "cohorts": defaultdict(int)}
            active_details[p]["count"] += 1
            active_details[p]["cohorts"][c] += 1

    active_breakdown = [
        {
            "name": p_val["name"],
            "count": p_val["count"],
            "cohorts": sorted([{"name": k, "count": v} for k, v in p_val["cohorts"].items()], key=lambda x: x["count"], reverse=True)
        }
        for p_val in active_details.values()
    ]
    active_breakdown.sort(key=lambda x: x["count"], reverse=True)

    graduated_details = {}
    for r in filtered_rows:
        if r["status"] == "Egresado":
            p = r["program"]
            c = r["cohort"]
            if p not in graduated_details:
                graduated_details[p] = {"name": p, "count": 0, "cohorts": defaultdict(int)}
            graduated_details[p]["count"] += 1
            graduated_details[p]["cohorts"][c] += 1

    graduated_breakdown = [
        {
            "name": p_val["name"],
            "count": p_val["count"],
            "cohorts": sorted([{"name": k, "count": v} for k, v in p_val["cohorts"].items()], key=lambda x: x["count"], reverse=True)
        }
        for p_val in graduated_details.values()
    ]
    graduated_breakdown.sort(key=lambda x: x["count"], reverse=True)

    return {
        "unique_students_count": unique_students_count,
        "active_students_count": active_students_count,
        "graduated_students_count": graduated_students_count,
        "program_graduations_count": program_graduations_count,
        "in_course_students_count": in_course_students_count,
        "total_records": total_records,
        "attendance_rate": round(attendance_rate, 2),
        "pass_rate": round(pass_rate, 2),

        "by_year": by_year,
        "by_program": by_program,
        "by_status": by_status,
        "by_block": by_block,
        "by_cohort": by_cohort,
        "by_month": by_month,
        "by_city": by_city,
        "by_education": by_education,

        "first_entries": first_entries,
        "cross_matrix": cross_matrix,

        "records": {
            "items": cleaned_items,
            "total": total_records,
            "page": current_page,
            "total_pages": total_pages,
        },

        "active_breakdown": active_breakdown,
        "graduated_breakdown": graduated_breakdown,
        "pass_breakdown": {"by_program": [], "by_block": []},
        "yearly_trend": [{"year": item["name"], "count": item["count"]} for item in by_year],
        "programs_chart": {
            "labels": [item["name"] for item in by_program],
            "counts": [item["count"] for item in by_program],
        },
    }
