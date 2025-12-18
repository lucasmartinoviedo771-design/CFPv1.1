from typing import List, Optional

from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError
from ninja import Router
from core.api.permissions import require_authenticated_group

from core.models import Nota, Asistencia, Examen, Estudiante, Bloque
from core.serializers import NotaSerializer, AsistenciaSerializer, ExamenSerializer
from .schemas import NotaIn, AsistenciaIn, ExamenIn
from core.services.evaluacion_service import EvaluacionService

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


# ==================== NUEVOS ENDPOINTS CON EVALUACION SERVICE ====================

@router.post("/registrar-nota-sincronico", response=dict)
@require_authenticated_group
def registrar_nota_sincronico(request, payload: dict):
    """
    Registra una nota de Final Sincrónico con validaciones de habilitación.
    
    Payload:
        estudiante_id: int
        examen_id: int (debe ser FINAL_SINC)
        calificacion: float
    """
    estudiante = get_object_or_404(Estudiante, pk=payload['estudiante_id'])
    examen = get_object_or_404(Examen, pk=payload['examen_id'])
    
    if examen.tipo_examen != Examen.FINAL_SINC:
        return {"error": "El examen debe ser de tipo Final Sincrónico"}, 400
    
    try:
        # Validar habilitación
        EvaluacionService.puede_rendir_final_sincronico(estudiante, examen.bloque)
        
        # Registrar la nota
        nota = EvaluacionService.registrar_nota_final_sincronico(
            estudiante=estudiante,
            examen_sinc=examen,
            calificacion=payload['calificacion']
        )
        
        mensaje = f"Nota registrada: {nota.calificacion}"
        if nota.aprobado:
            mensaje += " - APROBADO ✅"
        else:
            mensaje += " - DESAPROBADO ⚠️ (debe volver a rendir Virtual)"
        
        return {
            "success": True,
            "nota_id": nota.id,
            "calificacion": float(nota.calificacion),
            "aprobado": nota.aprobado,
            "es_nota_definitiva": nota.es_nota_definitiva,
            "intento": nota.intento,
            "mensaje": mensaje
        }
    except DjangoValidationError as e:
        return {"error": str(e)}, 400


@router.post("/registrar-nota-parcial", response=dict)
@require_authenticated_group
def registrar_nota_parcial(request, payload: dict):
    """
    Registra una nota de Parcial con el servicio de evaluación.
    
    Payload:
        estudiante_id: int
        examen_id: int (debe ser PARCIAL o RECUP)
        calificacion: float
    """
    estudiante = get_object_or_404(Estudiante, pk=payload['estudiante_id'])
    examen = get_object_or_404(Examen, pk=payload['examen_id'])
    
    try:
        nota = EvaluacionService.registrar_nota_parcial(
            estudiante=estudiante,
            examen_parcial=examen,
            calificacion=payload['calificacion']
        )
        
        return {
            "success": True,
            "nota_id": nota.id,
            "calificacion": float(nota.calificacion),
            "aprobado": nota.aprobado,
            "intento": nota.intento,
            "mensaje": f"Parcial registrado: {nota.calificacion} - {'APROBADO' if nota.aprobado else 'DESAPROBADO'}"
        }
    except DjangoValidationError as e:
        return {"error": str(e)}, 400


@router.get("/estudiante/{estudiante_id}/bloque/{bloque_id}/puede-rendir-sincronico", response=dict)
@require_authenticated_group
def verificar_habilitacion_sincronico(request, estudiante_id: int, bloque_id: int):
    """Verifica si un estudiante puede rendir el Final Sincrónico de un bloque."""
    estudiante = get_object_or_404(Estudiante, pk=estudiante_id)
    bloque = get_object_or_404(Bloque, pk=bloque_id)
    
    try:
        result = EvaluacionService.puede_rendir_final_sincronico(estudiante, bloque)
        return {
            "habilitado": True,
            "mensaje": result['mensaje'],
            "virtual_habilitante_id": result['virtual'].id if result['virtual'] else None
        }
    except DjangoValidationError as e:
        return {"habilitado": False, "mensaje": str(e)}


@router.get("/estudiante/{estudiante_id}/bloque/{bloque_id}/puede-rendir-virtual", response=dict)
@require_authenticated_group
def verificar_habilitacion_virtual(request, estudiante_id: int, bloque_id: int):
    """Verifica si un estudiante puede rendir el Final Virtual de un bloque."""
    estudiante = get_object_or_404(Estudiante, pk=estudiante_id)
    bloque = get_object_or_404(Bloque, pk=bloque_id)
    
    try:
        EvaluacionService.puede_rendir_final_virtual(estudiante, bloque)
        return {"habilitado": True, "mensaje": "El estudiante puede rendir el Final Virtual"}
    except DjangoValidationError as e:
        return {"habilitado": False, "mensaje": str(e)}


@router.get("/estudiante/{estudiante_id}/bloque/{bloque_id}/nota-definitiva", response=dict)
@require_authenticated_group
def obtener_nota_definitiva(request, estudiante_id: int, bloque_id: int):
    """Obtiene la nota definitiva de un bloque para un estudiante."""
    estudiante = get_object_or_404(Estudiante, pk=estudiante_id)
    bloque = get_object_or_404(Bloque, pk=bloque_id)
    
    nota = EvaluacionService.get_nota_definitiva_bloque(estudiante, bloque)
    
    if nota:
        return {
            "tiene_nota": True,
            "calificacion": float(nota.calificacion),
            "fecha": nota.fecha_calificacion.isoformat() if nota.fecha_calificacion else None,
            "intento": nota.intento,
            "nota_id": nota.id
        }
    else:
        return {"tiene_nota": False, "mensaje": "El bloque aún no está aprobado"}


@router.get("/estudiante/{estudiante_id}/bloque/{bloque_id}/estado-evaluacion", response=dict)
@require_authenticated_group
def obtener_estado_evaluacion(request, estudiante_id: int, bloque_id: int):
    """Obtiene el estado completo de evaluación de un estudiante en un bloque."""
    estudiante = get_object_or_404(Estudiante, pk=estudiante_id)
    bloque = get_object_or_404(Bloque, pk=bloque_id)
    
    estado = EvaluacionService.get_estado_evaluacion_bloque(estudiante, bloque)
    
    # Serializar historial
    historial_serializado = NotaSerializer(estado['historial'], many=True).data
    
    return {
        "aprobado": estado['aprobado'],
        "nota_final": float(estado['nota_final']) if estado.get('nota_final') else None,
        "puede_virtual": estado.get('puede_virtual', False),
        "puede_sincronico": estado.get('puede_sincronico', False),
        "mensaje_virtual": estado.get('mensaje_virtual', ''),
        "mensaje_sincronico": estado.get('mensaje_sincronico', ''),
        "siguiente_paso": estado['siguiente_paso'],
        "historial": historial_serializado
    }


@router.get("/estudiante/{estudiante_id}/bloque/{bloque_id}/historial", response=List[dict])
@require_authenticated_group
def obtener_historial_intentos(request, estudiante_id: int, bloque_id: int):
    """Obtiene el historial completo de intentos de un estudiante en un bloque."""
    estudiante = get_object_or_404(Estudiante, pk=estudiante_id)
    bloque = get_object_or_404(Bloque, pk=bloque_id)
    
    historial = EvaluacionService.get_historial_intentos_bloque(estudiante, bloque)
    return NotaSerializer(historial, many=True).data
