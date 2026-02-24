from datetime import date, timedelta
from typing import List, Optional

from django.db import transaction
from ninja import Router, Schema
from ninja.errors import HttpError

from core.models import Cohorte, Estudiante, Inscripcion, Examen, Bloque, Modulo
from core.serializers import EstudianteSerializer
from core.utils.estudiante_normalization import normalize_dni_digits

router = Router(tags=["preinscripciones-publicas"])


class OfertaBloqueOut(Schema):
    bloque_id: int
    bloque_nombre: str
    cohorte_id: int
    cohorte_nombre: str
    correlativas_ids: List[int]


class OfertaProgramaOut(Schema):
    programa_id: int
    programa_nombre: str
    requiere_titulo_secundario: bool
    bloques: List[OfertaBloqueOut]


class PreinscripcionOfertaOut(Schema):
    items: List[OfertaProgramaOut]


class PreinscripcionIn(Schema):
    email: str
    apellido: str
    nombre: str
    dni: str
    cuit: Optional[str] = None
    sexo: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    pais_nacimiento: Optional[str] = None
    pais_nacimiento_otro: Optional[str] = None
    nacionalidad: Optional[str] = None
    nacionalidad_otra: Optional[str] = None
    lugar_nacimiento: Optional[str] = None
    domicilio: Optional[str] = None
    barrio: Optional[str] = None
    ciudad: Optional[str] = None
    telefono: Optional[str] = None
    nivel_educativo: Optional[str] = None
    posee_pc: Optional[bool] = False
    posee_conectividad: Optional[bool] = False
    puede_traer_pc: Optional[bool] = False
    trabaja: Optional[bool] = False
    lugar_trabajo: Optional[str] = None
    programa_id: int
    bloque_ids: Optional[List[int]] = None
    dni_digitalizado: str
    titulo_secundario_digitalizado: Optional[str] = None


class PreinscripcionOut(Schema):
    ok: bool
    estudiante_id: int
    estatus: str
    inscripciones_creadas: List[int]
    inscripciones_existentes: List[int]
    mensaje: str


def _bloques_aprobados_ids(estudiante_id: int) -> set[int]:
    return set(
        Bloque.objects.filter(
            examenes__notas__estudiante_id=estudiante_id,
            examenes__notas__aprobado=True,
            examenes__tipo_examen__in=[Examen.FINAL_SINC, Examen.FINAL_VIRTUAL, Examen.EQUIVALENCIA],
        )
        .distinct()
        .values_list("id", flat=True)
    )


def _esta_en_periodo_examenes(cohorte: Cohorte, hoy: date) -> bool:
    if not cohorte.fecha_fin:
        return False
    return hoy >= (cohorte.fecha_fin - timedelta(days=14))


def _cohortes_habilitadas() -> List[Cohorte]:
    hoy = date.today()
    base_qs = (
        Cohorte.objects.select_related("programa", "bloque")
        .prefetch_related("bloque__correlativas", "bloque__modulos")
        .filter(programa__activo=True, bloque__isnull=False)
    )
    agrupadas: dict[tuple[int, int], List[Cohorte]] = {}
    for cohorte in base_qs:
        key = (cohorte.programa_id, cohorte.bloque_id)
        agrupadas.setdefault(key, []).append(cohorte)

    habilitadas: List[Cohorte] = []
    for _, cohortes in agrupadas.items():
        cohortes_sorted = sorted(cohortes, key=lambda c: ((c.fecha_inicio or date.min), c.id))
        actuales = [
            c for c in cohortes_sorted
            if c.fecha_inicio and c.fecha_inicio <= hoy and (not c.fecha_fin or hoy <= c.fecha_fin)
        ]
        actual = actuales[-1] if actuales else None
        futuras = [c for c in cohortes_sorted if c.fecha_inicio and c.fecha_inicio > hoy]
        siguiente = futuras[0] if futuras else None

        if actual and not _esta_en_periodo_examenes(actual, hoy):
            habilitadas.append(actual)
        elif siguiente:
            habilitadas.append(siguiente)
        elif actual:
            habilitadas.append(actual)
    return habilitadas


def _validar_correlativas(estudiante_id: int, cohortes: List[Cohorte]):
    bloques_aprobados = _bloques_aprobados_ids(estudiante_id)
    for cohorte in cohortes:
        faltantes = [b.id for b in cohorte.bloque.correlativas.all() if b.id not in bloques_aprobados]
        if faltantes:
            raise HttpError(
                400,
                (
                    f"No cumple correlativas para '{cohorte.bloque.nombre}'. "
                    f"Bloques requeridos: {', '.join(str(x) for x in faltantes)}."
                ),
            )


@router.get("/oferta", response=PreinscripcionOfertaOut, auth=None)
def listar_oferta_preinscripcion(request, programa_id: Optional[int] = None):
    qs = _cohortes_habilitadas()
    if programa_id:
        qs = [c for c in qs if c.programa_id == programa_id]
    items_map: dict[int, dict] = {}
    for c in qs:
        if c.programa_id not in items_map:
            items_map[c.programa_id] = {
                "programa_id": c.programa_id,
                "programa_nombre": c.programa.nombre,
                "requiere_titulo_secundario": c.programa.requiere_titulo_secundario,
                "bloques": [],
            }
        items_map[c.programa_id]["bloques"].append(
            {
                "bloque_id": c.bloque_id,
                "bloque_nombre": c.bloque.nombre,
                "cohorte_id": c.id,
                "cohorte_nombre": c.nombre,
                "correlativas_ids": list(c.bloque.correlativas.values_list("id", flat=True)),
            }
        )
    items = [
        OfertaProgramaOut(
            programa_id=v["programa_id"],
            programa_nombre=v["programa_nombre"],
            requiere_titulo_secundario=v["requiere_titulo_secundario"],
            bloques=[OfertaBloqueOut(**b) for b in v["bloques"]],
        )
        for v in items_map.values()
    ]
    return PreinscripcionOfertaOut(items=items)


@router.post("", response=PreinscripcionOut, auth=None)
def crear_preinscripcion_publica(request, payload: PreinscripcionIn):
    dni = normalize_dni_digits(payload.dni)
    if len(dni) != 8:
        raise HttpError(400, "El DNI debe tener 8 dígitos.")
    if not payload.dni_digitalizado:
        raise HttpError(400, "Debe adjuntar la copia digitalizada del DNI.")

    with transaction.atomic():
        estudiante = Estudiante.objects.filter(dni=dni).first()
        if not estudiante:
            estudiante = Estudiante(dni=dni)

        serializer_data = {
            "email": payload.email,
            "apellido": payload.apellido,
            "nombre": payload.nombre,
            "dni": dni,
            "cuit": payload.cuit,
            "sexo": payload.sexo,
            "fecha_nacimiento": payload.fecha_nacimiento,
            "pais_nacimiento": payload.pais_nacimiento,
            "pais_nacimiento_otro": payload.pais_nacimiento_otro,
            "nacionalidad": payload.nacionalidad,
            "nacionalidad_otra": payload.nacionalidad_otra,
            "lugar_nacimiento": payload.lugar_nacimiento,
            "domicilio": payload.domicilio,
            "barrio": payload.barrio,
            "ciudad": payload.ciudad,
            "telefono": payload.telefono,
            "nivel_educativo": payload.nivel_educativo,
            "posee_pc": payload.posee_pc,
            "posee_conectividad": payload.posee_conectividad,
            "puede_traer_pc": payload.puede_traer_pc,
            "trabaja": payload.trabaja,
            "lugar_trabajo": payload.lugar_trabajo,
            "dni_digitalizado": payload.dni_digitalizado,
        }

        if payload.titulo_secundario_digitalizado:
            serializer_data["titulo_secundario_digitalizado"] = payload.titulo_secundario_digitalizado

        serializer = EstudianteSerializer(instance=estudiante, data=serializer_data, partial=True)
        serializer.is_valid(raise_exception=True)
        estudiante = serializer.save()

        cohortes_habilitadas = [
            c for c in _cohortes_habilitadas() if c.programa_id == payload.programa_id
        ]
        if not cohortes_habilitadas:
            raise HttpError(400, "El programa seleccionado no tiene cohortes habilitadas.")

        cohortes_por_bloque = {c.bloque_id: c for c in cohortes_habilitadas}
        bloques_disponibles = set(cohortes_por_bloque.keys())
        bloques_seleccionados = payload.bloque_ids or sorted(list(bloques_disponibles))
        bloques_seleccionados = [int(b) for b in bloques_seleccionados]

        if not bloques_seleccionados:
            raise HttpError(400, "Debe seleccionar al menos un bloque.")
        if any(b not in bloques_disponibles for b in bloques_seleccionados):
            raise HttpError(400, "Uno o más bloques seleccionados no están habilitados para el programa.")

        cohortes = [cohortes_por_bloque[b] for b in bloques_seleccionados]

        _validar_correlativas(estudiante.id, cohortes)
        requiere_titulo = any(c.programa.requiere_titulo_secundario for c in cohortes)
        if requiere_titulo and not (payload.titulo_secundario_digitalizado or estudiante.titulo_secundario_digitalizado):
            raise HttpError(
                400,
                "Al menos una preinscripción seleccionada requiere título secundario digitalizado.",
            )

        if requiere_titulo and payload.titulo_secundario_digitalizado:
            estudiante.titulo_secundario_digitalizado = payload.titulo_secundario_digitalizado

        if estudiante.estatus in ("", "Preinscripto"):
            estudiante.estatus = "Preinscripto"

        estudiante.save(update_fields=["dni_digitalizado", "titulo_secundario_digitalizado", "estatus", "updated_at"])

        inscripciones_creadas = []
        inscripciones_existentes = []
        for cohorte in cohortes:
            # Regla de primera inscripción: se asigna siempre al módulo 1 (o único).
            modulo_inicial = Modulo.objects.filter(bloque_id=cohorte.bloque_id).order_by("id").first()
            if not modulo_inicial:
                raise HttpError(400, f"La cohorte '{cohorte.nombre}' no tiene módulos configurados.")

            # Si ya tiene inscripción en ese bloque, no se duplica.
            previas_bloque = list(
                Inscripcion.objects.filter(
                    estudiante=estudiante,
                    modulo__bloque_id=cohorte.bloque_id,
                ).values_list("id", flat=True)
            )
            if previas_bloque:
                inscripciones_existentes.extend(previas_bloque)
                continue

            insc = Inscripcion.objects.filter(
                estudiante=estudiante,
                cohorte=cohorte,
                modulo_id=modulo_inicial.id,
            ).first()
            if insc:
                inscripciones_existentes.append(insc.id)
                continue

            created = Inscripcion.objects.create(
                estudiante=estudiante,
                cohorte=cohorte,
                modulo_id=modulo_inicial.id,
                estado=Inscripcion.INSCRIPTO,
            )
            inscripciones_creadas.append(created.id)

    return PreinscripcionOut(
        ok=True,
        estudiante_id=estudiante.id,
        estatus=estudiante.estatus,
        inscripciones_creadas=inscripciones_creadas,
        inscripciones_existentes=inscripciones_existentes,
        mensaje="Preinscripción registrada correctamente.",
    )
