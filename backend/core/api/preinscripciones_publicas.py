from typing import List, Optional

from django.db import transaction
from ninja import Router, Schema
from ninja.errors import HttpError

from core.models import Cohorte, Estudiante, Inscripcion, Examen, Bloque
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


class PreinscripcionOfertaOut(Schema):
    items: List[OfertaBloqueOut]


class PreinscripcionIn(Schema):
    email: str
    apellido: str
    nombre: str
    dni: str
    fecha_nacimiento: Optional[str] = None
    nacionalidad: Optional[str] = None
    domicilio: Optional[str] = None
    barrio: Optional[str] = None
    ciudad: Optional[str] = None
    telefono: Optional[str] = None
    nivel_educativo: Optional[str] = None
    trabaja: Optional[bool] = False
    lugar_trabajo: Optional[str] = None
    cohorte_ids: List[int]
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


def _validar_correlativas(estudiante_id: int, cohorte_ids: List[int]):
    cohortes = list(
        Cohorte.objects.select_related("bloque", "programa")
        .prefetch_related("bloque__correlativas")
        .filter(id__in=cohorte_ids)
    )
    if len(cohortes) != len(set(cohorte_ids)):
        raise HttpError(400, "Una o más cohortes seleccionadas no existen.")

    bloques_aprobados = _bloques_aprobados_ids(estudiante_id)
    for cohorte in cohortes:
        if not cohorte.bloque_id:
            raise HttpError(400, f"La cohorte '{cohorte.nombre}' no tiene bloque asignado.")
        faltantes = [b.id for b in cohorte.bloque.correlativas.all() if b.id not in bloques_aprobados]
        if faltantes:
            raise HttpError(
                400,
                (
                    f"No cumple correlativas para '{cohorte.bloque.nombre}'. "
                    f"Bloques requeridos: {', '.join(str(x) for x in faltantes)}."
                ),
            )
    return cohortes


@router.get("/oferta", response=PreinscripcionOfertaOut, auth=None)
def listar_oferta_preinscripcion(request, programa_id: Optional[int] = None):
    qs = (
        Cohorte.objects.select_related("programa", "bloque")
        .prefetch_related("bloque__correlativas")
        .filter(programa__activo=True)
        .order_by("-fecha_inicio", "id")
    )
    if programa_id:
        qs = qs.filter(programa_id=programa_id)

    items = []
    for c in qs:
        if not c.bloque_id:
            continue
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
            )
        )
    return PreinscripcionOfertaOut(items=items)


@router.post("", response=PreinscripcionOut, auth=None)
def crear_preinscripcion_publica(request, payload: PreinscripcionIn):
    dni = normalize_dni_digits(payload.dni)
    if len(dni) != 8:
        raise HttpError(400, "El DNI debe tener 8 dígitos.")
    if not payload.cohorte_ids:
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
            "fecha_nacimiento": payload.fecha_nacimiento,
            "nacionalidad": payload.nacionalidad,
            "domicilio": payload.domicilio,
            "barrio": payload.barrio,
            "ciudad": payload.ciudad,
            "telefono": payload.telefono,
            "nivel_educativo": payload.nivel_educativo,
            "trabaja": payload.trabaja,
            "lugar_trabajo": payload.lugar_trabajo,
            "dni_digitalizado": payload.dni_digitalizado,
        }

        if payload.titulo_secundario_digitalizado:
            serializer_data["titulo_secundario_digitalizado"] = payload.titulo_secundario_digitalizado

        serializer = EstudianteSerializer(instance=estudiante, data=serializer_data, partial=True)
        serializer.is_valid(raise_exception=True)
        estudiante = serializer.save()

        cohortes = _validar_correlativas(estudiante.id, payload.cohorte_ids)
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
            insc = Inscripcion.objects.filter(estudiante=estudiante, cohorte=cohorte, modulo__isnull=True).first()
            if insc:
                inscripciones_existentes.append(insc.id)
                continue
            created = Inscripcion.objects.create(
                estudiante=estudiante,
                cohorte=cohorte,
                modulo=None,
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
