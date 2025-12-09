from typing import List, Optional

from django.shortcuts import get_object_or_404
from ninja import Router
from core.api.permissions import require_authenticated_group

from core.models import Nota, Asistencia, Examen
from core.serializers import NotaSerializer, AsistenciaSerializer, ExamenSerializer
from .schemas import NotaIn, AsistenciaIn, ExamenIn

router = Router(tags=["examenes-notas"])


# --- Notas ---
@router.get("/notas", response=List[dict])
@require_authenticated_group
def listar_notas(
    request,
    examen_id: Optional[int] = None,
    estudiante_id: Optional[int] = None,
    aprobado: Optional[bool] = None,
    modulo_id: Optional[int] = None,
    bloque_id: Optional[int] = None,
):
    qs = Nota.objects.select_related(
        "examen",
        "examen__modulo",
        "examen__bloque",
        "estudiante",
    )
    if examen_id:
        qs = qs.filter(examen_id=examen_id)
    if estudiante_id:
        qs = qs.filter(estudiante_id=estudiante_id)
    if aprobado is not None:
        qs = qs.filter(aprobado=aprobado)
    if modulo_id:
        qs = qs.filter(examen__modulo_id=modulo_id)
    if bloque_id:
        qs = qs.filter(examen__bloque_id=bloque_id)
    return NotaSerializer(qs, many=True).data


@router.get("/notas/{nota_id}", response=dict)
@require_authenticated_group
def detalle_nota(request, nota_id: int):
    nota = get_object_or_404(
        Nota.objects.select_related("examen", "examen__modulo", "examen__bloque", "estudiante"),
        pk=nota_id,
    )
    return NotaSerializer(nota).data


# --- Examenes ---
@router.get("", response=List[dict])
@require_authenticated_group
def listar_examenes(request, modulo_id: Optional[int] = None, bloque_id: Optional[int] = None, tipo_examen: Optional[str] = None):
    qs = Examen.objects.select_related("modulo", "bloque").order_by("id")
    if modulo_id:
        qs = qs.filter(modulo_id=modulo_id)
    if bloque_id:
        qs = qs.filter(bloque_id=bloque_id)
    if tipo_examen:
        qs = qs.filter(tipo_examen=tipo_examen)
    return ExamenSerializer(qs, many=True).data


@router.get("/{examen_id}", response=dict)
@require_authenticated_group
def detalle_examen(request, examen_id: int):
    examen = get_object_or_404(Examen.objects.select_related("modulo", "bloque"), pk=examen_id)
    return ExamenSerializer(examen).data


@router.post("", response=dict)
@require_authenticated_group
def crear_examen(request, payload: ExamenIn):
    data = payload.dict(exclude_none=True)
    if 'modulo_id' in data:
        data['modulo'] = data.pop('modulo_id')
    if 'bloque_id' in data:
        data['bloque'] = data.pop('bloque_id')

    serializer = ExamenSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    ex = serializer.save()
    return ExamenSerializer(ex).data


@router.put("/{examen_id}", response=dict)
@router.patch("/{examen_id}", response=dict)
@require_authenticated_group
def actualizar_examen(request, examen_id: int, payload: ExamenIn):
    ex = get_object_or_404(Examen, pk=examen_id)
    data = payload.dict(exclude_none=True)
    if 'modulo_id' in data:
        data['modulo'] = data.pop('modulo_id')
    if 'bloque_id' in data:
        data['bloque'] = data.pop('bloque_id')

    serializer = ExamenSerializer(instance=ex, data=data, partial=True)
    serializer.is_valid(raise_exception=True)
    ex = serializer.save()
    return ExamenSerializer(ex).data


@router.post("/notas", response=dict)
@require_authenticated_group
def crear_nota(request, payload: NotaIn):
    serializer = NotaSerializer(data=payload.dict(exclude_none=True))
    serializer.is_valid(raise_exception=True)
    nota = serializer.save()
    return NotaSerializer(nota).data


@router.put("/notas/{nota_id}", response=dict)
@router.patch("/notas/{nota_id}", response=dict)
@require_authenticated_group
def actualizar_nota(request, nota_id: int, payload: NotaIn):
    nota = get_object_or_404(Nota, pk=nota_id)
    serializer = NotaSerializer(instance=nota, data=payload.dict(exclude_none=True), partial=True)
    serializer.is_valid(raise_exception=True)
    nota = serializer.save()
    return NotaSerializer(nota).data


# --- Asistencias ---
@router.get("/asistencias", response=List[dict])
@require_authenticated_group
def listar_asistencias(
    request,
    estudiante_id: Optional[int] = None,
    modulo_id: Optional[int] = None,
    bloque_id: Optional[int] = None,
    presente: Optional[bool] = None,
    fecha: Optional[str] = None,
):
    qs = Asistencia.objects.select_related("estudiante", "modulo", "modulo__bloque")
    if estudiante_id:
        qs = qs.filter(estudiante_id=estudiante_id)
    if modulo_id:
        qs = qs.filter(modulo_id=modulo_id)
    if bloque_id:
        qs = qs.filter(modulo__bloque_id=bloque_id)
    if presente is not None:
        qs = qs.filter(presente=presente)
    if fecha:
        qs = qs.filter(fecha=fecha)
    return AsistenciaSerializer(qs, many=True).data


@router.get("/asistencias/{asistencia_id}", response=dict)
@require_authenticated_group
def detalle_asistencia(request, asistencia_id: int):
    asistencia = get_object_or_404(
        Asistencia.objects.select_related("estudiante", "modulo", "modulo__bloque"),
        pk=asistencia_id,
    )
    return AsistenciaSerializer(asistencia).data


@router.post("/asistencias", response=dict)
@require_authenticated_group
def crear_asistencia(request, payload: AsistenciaIn):
    serializer = AsistenciaSerializer(data=payload.dict(exclude_none=True))
    serializer.is_valid(raise_exception=True)
    asistencia = serializer.save()
    return AsistenciaSerializer(asistencia).data


@router.put("/asistencias/{asistencia_id}", response=dict)
@router.patch("/asistencias/{asistencia_id}", response=dict)
@require_authenticated_group
def actualizar_asistencia(request, asistencia_id: int, payload: AsistenciaIn):
    asistencia = get_object_or_404(Asistencia, pk=asistencia_id)
    serializer = AsistenciaSerializer(instance=asistencia, data=payload.dict(exclude_none=True), partial=True)
    serializer.is_valid(raise_exception=True)
    asistencia = serializer.save()
    return AsistenciaSerializer(asistencia).data
