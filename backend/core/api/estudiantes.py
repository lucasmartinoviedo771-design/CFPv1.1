from typing import List, Optional

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from ninja import Router, Schema, File, UploadedFile
from core.api.permissions import require_authenticated_group

from core.models import Estudiante, Inscripcion
from core.serializers import EstudianteSerializer
from core.services.email_service import enviar_correo_bienvenida
from .schemas import EstudianteOut, EstudianteDetailOut, EstudianteIn

class BulkIdsIn(Schema):
    ids: List[int]

router = Router(tags=["estudiantes"])


@router.get("", response=List[EstudianteDetailOut])
@require_authenticated_group
def listar_estudiantes(request, search: Optional[str] = None, dni: Optional[str] = None, estatus: Optional[str] = None):
    qs = Estudiante.objects.all().prefetch_related(
        "inscripciones__cohorte__programa", "inscripciones__cohorte__bloque"
    ).order_by("apellido", "nombre")
    if dni:
        qs = qs.filter(dni__iexact=dni)
    if estatus:
        qs = qs.filter(estatus=estatus)
    if search:
        qs = qs.filter(
            Q(apellido__icontains=search)
            | Q(nombre__icontains=search)
            | Q(email__icontains=search)
            | Q(dni__icontains=search)
        )
    return qs


@router.get("/{estudiante_id}", response=EstudianteDetailOut)
@require_authenticated_group
def detalle_estudiante(request, estudiante_id: int):
    return get_object_or_404(Estudiante, pk=estudiante_id)


@router.post("", response=EstudianteDetailOut)
@require_authenticated_group
def crear_estudiante(request, payload: EstudianteIn):
    serializer = EstudianteSerializer(data=payload.dict(exclude_unset=True, exclude_none=True))
    serializer.is_valid(raise_exception=True)
    estudiante = serializer.save()
    return detalle_estudiante(request, estudiante.id)


@router.put("/{estudiante_id}", response=EstudianteDetailOut)
@router.patch("/{estudiante_id}", response=EstudianteDetailOut)
@require_authenticated_group
def actualizar_estudiante_patch(request, estudiante_id: int, payload: EstudianteIn):
    estudiante = get_object_or_404(Estudiante, pk=estudiante_id)
    old_status = estudiante.estatus
    serializer = EstudianteSerializer(instance=estudiante, data=payload.dict(exclude_unset=True, exclude_none=True), partial=True)
    serializer.is_valid(raise_exception=True)
    estudiante = serializer.save()
    
    # Si cambió a Regular, enviamos bienvenida
    if old_status == "Preinscripto" and estudiante.estatus == "Regular":
        enviar_correo_bienvenida(estudiante.id)
        
    return detalle_estudiante(request, estudiante.id)

@router.post("/{estudiante_id}/documentos", response=EstudianteDetailOut)
@require_authenticated_group
def actualizar_documentos(
    request,
    estudiante_id: int,
    dni_digitalizado: UploadedFile = File(None),
    titulo_secundario_digitalizado: UploadedFile = File(None),
    dni_tutor_digitalizado: UploadedFile = File(None),
    nota_parental_firmada: UploadedFile = File(None),
):
    estudiante = get_object_or_404(Estudiante, id=estudiante_id)
    
    update_fields = []
    if dni_digitalizado:
        estudiante.dni_digitalizado = dni_digitalizado
        update_fields.append("dni_digitalizado")
    if titulo_secundario_digitalizado:
        estudiante.titulo_secundario_digitalizado = titulo_secundario_digitalizado
        update_fields.append("titulo_secundario_digitalizado")
    if dni_tutor_digitalizado:
        estudiante.dni_tutor_digitalizado = dni_tutor_digitalizado
        update_fields.append("dni_tutor_digitalizado")
    if nota_parental_firmada:
        estudiante.nota_parental_firmada = nota_parental_firmada
        update_fields.append("nota_parental_firmada")
        
    if update_fields:
        update_fields.append("updated_at")
        estudiante.save(update_fields=update_fields)
        
    return detalle_estudiante(request, estudiante.id)


@router.post("/bulk_approve/", response=dict)
@require_authenticated_group
def bulk_approve(request, data: BulkIdsIn):
    with transaction.atomic():
        # Capturamos los IDs de los estudiantes que realmente vamos a actualizar
        estudiantes_ids = list(Estudiante.objects.filter(
            id__in=data.ids, 
            estatus="Preinscripto"
        ).values_list("id", flat=True))
        
        if not estudiantes_ids:
            return {"updated": 0}
            
        # Actualizamos Estudiantes uno por uno para disparar señales y enviar emails
        estudiantes = Estudiante.objects.filter(id__in=estudiantes_ids)
        updated_count = 0
        for estudiante in estudiantes:
            estudiante.estatus = "Regular"
            estudiante.updated_at = timezone.now()
            estudiante.save()
            
            # Enviar correo de bienvenida
            enviar_correo_bienvenida(estudiante.id)
            updated_count += 1
        
        # Actualizamos Inscripciones de esos estudiantes: Inscripto -> Activo
        from core.models import Inscripcion
        Inscripcion.objects.filter(
            estudiante_id__in=estudiantes_ids,
            estado=Inscripcion.PREINSCRIPTO
        ).update(
            estado=Inscripcion.CURSANDO,
            updated_at=timezone.now()
        )
        
    return {"updated": updated_count}


@router.post("/bulk_delete/", response=dict)
@require_authenticated_group
def bulk_delete(request, data: BulkIdsIn):
    # Verificar si el usuario es Admin o superusuario
    if not (request.user.is_superuser or request.user.groups.filter(name="Admin").exists()):
        from ninja.errors import HttpError
        raise HttpError(403, "Solo administradores pueden realizar esta acción.")

    with transaction.atomic():
        deleted_count, _ = Estudiante.objects.filter(id__in=data.ids).delete()
    return {"deleted": deleted_count}
