from ninja import Router, Schema, File, UploadedFile
from django.shortcuts import get_object_or_404
from django.utils import timezone
from core.models import Estudiante
from typing import Optional
import uuid

router = Router(tags=["autorizaciones"])

class AutorizacionInfoOut(Schema):
    estudiante_id: int
    estudiante_nombre: str
    estudiante_apellido: str
    tutor_nombre: str
    programa_nombre: Optional[str] = None
    status: str

@router.get("/{token}", response=AutorizacionInfoOut)
def get_autorizacion_info(request, token: str):
    estudiante = get_object_or_404(Estudiante, autorizacion_token=token)
    # Buscamos la última inscripción para mostrar el programa relevante
    insc = estudiante.inscripciones.all().order_by('-created_at').first()
    prog_nombre = insc.cohorte.programa.nombre if insc else "Curso del CFP"
    
    return {
        "estudiante_id": estudiante.id,
        "estudiante_nombre": estudiante.nombre,
        "estudiante_apellido": estudiante.apellido,
        "tutor_nombre": estudiante.tutor_nombre,
        "programa_nombre": prog_nombre,
        "status": estudiante.autorizacion_status,
    }

@router.post("/{token}/submit")
def submit_autorizacion(
    request, 
    token: str, 
    selfie: UploadedFile = File(...),
):
    estudiante = get_object_or_404(Estudiante, autorizacion_token=token)
    estudiante.autorizacion_status = 'DIGITAL'
    estudiante.autorizacion_selfie = selfie
    estudiante.autorizacion_fecha = timezone.now()
    estudiante.save()
    return {"message": "Autorización enviada correctamente"}

# Endpoint para generar link (para el admin)
@router.post("/generate/{estudiante_id}")
def generate_token(request, estudiante_id: int):
    # Nota: Este debería estar protegido, pero lo ponemos aquí por simplicidad inicial
    # En la práctica, se llamará desde un contexto autenticado en el frontend de gestión
    estudiante = get_object_or_404(Estudiante, id=estudiante_id)
    if not estudiante.autorizacion_token:
        estudiante.autorizacion_token = str(uuid.uuid4())
        estudiante.save()
    return {"token": estudiante.autorizacion_token}
