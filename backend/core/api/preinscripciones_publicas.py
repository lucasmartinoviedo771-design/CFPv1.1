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
    cohorte_id: int
    cohorte_nombre: str
    programa_id: int
    programa_nombre: str
    bloque_id: int
    bloque_nombre: str
    requiere_titulo_secundario: bool
    correlativas_ids: List[int]
    modulos: List[dict]


class PreinscripcionOfertaOut(Schema):
    items: List[OfertaBloqueOut]


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
    cohorte_ids: Optional[List[int]] = None
    seleccion_modulos_por_cohorte: Optional[List[dict]] = None
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


def _normalizar_seleccion(payload: PreinscripcionIn) -> dict[int, List[int]]:
    seleccion: dict[int, List[int]] = {}
    if payload.seleccion_modulos_por_cohorte:
        for item in payload.seleccion_modulos_por_cohorte:
            cohorte_id = item.get("cohorte_id")
            modulo_ids = item.get("modulo_ids") or []
            if not cohorte_id:
                continue
            seleccion[int(cohorte_id)] = [int(m) for m in modulo_ids]
    elif payload.cohorte_ids:
        for cohorte_id in payload.cohorte_ids:
            seleccion[int(cohorte_id)] = []
    return seleccion


@router.get("/oferta", response=PreinscripcionOfertaOut, auth=None)
def listar_oferta_preinscripcion(request, programa_id: Optional[int] = None):
    qs = _cohortes_habilitadas()
    if programa_id:
        qs = [c for c in qs if c.programa_id == programa_id]
    items = []
    for c in qs:
        modulos = list(c.bloque.modulos.all().order_by("id"))
        items.append(
            OfertaBloqueOut(
                cohorte_id=c.id,
                cohorte_nombre=c.nombre,
                programa_id=c.programa_id,
                programa_nombre=c.programa.nombre,
                bloque_id=c.bloque_id,
                bloque_nombre=c.bloque.nombre,
                requiere_titulo_secundario=c.programa.requiere_titulo_secundario,
                correlativas_ids=list(c.bloque.correlativas.values_list("id", flat=True)),
                modulos=[{"id": m.id, "nombre": m.nombre} for m in modulos],
            )
        )
    return PreinscripcionOfertaOut(items=items)


@router.post("", response=PreinscripcionOut, auth=None)
def crear_preinscripcion_publica(request, payload: PreinscripcionIn):
    dni = normalize_dni_digits(payload.dni)
    if len(dni) != 8:
        raise HttpError(400, "El DNI debe tener 8 dígitos.")
    seleccion = _normalizar_seleccion(payload)
    if not seleccion:
        raise HttpError(400, "Debe seleccionar al menos una cohorte.")
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

        habilitadas = {c.id: c for c in _cohortes_habilitadas()}
        cohortes = []
        for cohorte_id in seleccion.keys():
            cohorte = habilitadas.get(cohorte_id)
            if not cohorte:
                raise HttpError(400, f"La cohorte {cohorte_id} no está habilitada para preinscripción.")
            cohortes.append(cohorte)

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
            modulos_bloque = list(Modulo.objects.filter(bloque_id=cohorte.bloque_id).order_by("id"))
            if not modulos_bloque:
                raise HttpError(400, f"La cohorte '{cohorte.nombre}' no tiene módulos configurados.")

            seleccion_modulo_ids = seleccion.get(cohorte.id) or [m.id for m in modulos_bloque]
            validos = {m.id for m in modulos_bloque}
            seleccion_modulo_ids = [m_id for m_id in seleccion_modulo_ids if m_id in validos]

            if len(modulos_bloque) == 1:
                seleccion_modulo_ids = [modulos_bloque[0].id]

            if not seleccion_modulo_ids:
                raise HttpError(400, f"Debe seleccionar al menos un módulo para la cohorte '{cohorte.nombre}'.")

            for modulo_id in seleccion_modulo_ids:
                insc = Inscripcion.objects.filter(estudiante=estudiante, cohorte=cohorte, modulo_id=modulo_id).first()
                if insc:
                    inscripciones_existentes.append(insc.id)
                    continue
                created = Inscripcion.objects.create(
                    estudiante=estudiante,
                    cohorte=cohorte,
                    modulo_id=modulo_id,
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
