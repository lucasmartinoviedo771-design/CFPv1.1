from typing import List, Optional

from django.db.models import Q
from django.shortcuts import get_object_or_404
from ninja import Router
from core.api.permissions import require_authenticated_group

from core.models import Estudiante
from core.serializers import EstudianteSerializer
from .schemas import EstudianteOut, EstudianteDetailOut, EstudianteIn

router = Router(tags=["estudiantes"])


@router.get("", response=List[EstudianteDetailOut])
@require_authenticated_group
def listar_estudiantes(request, search: Optional[str] = None, dni: Optional[str] = None, estatus: Optional[str] = None):
    qs = Estudiante.objects.all().order_by("apellido", "nombre")
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
    e = get_object_or_404(Estudiante.objects.all(), pk=estudiante_id)
    return EstudianteDetailOut(
        id=e.id,
        apellido=e.apellido,
        nombre=e.nombre,
        email=e.email,
        dni=e.dni,
        estatus=e.estatus,
        ciudad=e.ciudad,
        telefono=e.telefono,
        cuit=e.cuit,
        sexo=e.sexo,
        fecha_nacimiento=e.fecha_nacimiento,
        pais_nacimiento=e.pais_nacimiento,
        nacionalidad=e.nacionalidad,
        lugar_nacimiento=e.lugar_nacimiento,
        domicilio=e.domicilio,
        barrio=e.barrio,
        nivel_educativo=e.nivel_educativo,
        posee_pc=e.posee_pc,
        posee_conectividad=e.posee_conectividad,
        puede_traer_pc=e.puede_traer_pc,
        trabaja=e.trabaja,
        lugar_trabajo=e.lugar_trabajo,
        dni_digitalizado=e.dni_digitalizado,
        titulo_secundario_digitalizado=e.titulo_secundario_digitalizado,
        created_at=e.created_at,
        updated_at=e.updated_at,
    )


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
    serializer = EstudianteSerializer(instance=estudiante, data=payload.dict(exclude_unset=True, exclude_none=True), partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return detalle_estudiante(request, estudiante.id)

@router.post("/{estudiante_id}/documentos", response=EstudianteDetailOut)
@require_authenticated_group
def subir_documentos_estudiante(request, estudiante_id: int):
    estudiante = get_object_or_404(Estudiante, pk=estudiante_id)
    
    dni_file = request.FILES.get('dni_digitalizado')
    titulo_file = request.FILES.get('titulo_secundario_digitalizado')
    
    update_fields = []
    if dni_file:
        estudiante.dni_digitalizado = dni_file
        update_fields.append("dni_digitalizado")
    if titulo_file:
        estudiante.titulo_secundario_digitalizado = titulo_file
        update_fields.append("titulo_secundario_digitalizado")
        
    if update_fields:
        update_fields.append("updated_at")
        estudiante.save(update_fields=update_fields)
        
    return detalle_estudiante(request, estudiante.id)
