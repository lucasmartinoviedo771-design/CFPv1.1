from typing import List, Optional

from django.db.models import Q
from django.shortcuts import get_object_or_404
from ninja import Router

from core.models import Estudiante
from core.serializers import EstudianteSerializer
from .schemas import EstudianteOut, EstudianteDetailOut, EstudianteIn

router = Router(tags=["estudiantes"])


@router.get("", response=List[EstudianteOut])
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
    return [
        EstudianteOut(
            id=e.id,
            apellido=e.apellido,
            nombre=e.nombre,
            email=e.email,
            dni=e.dni,
            estatus=e.estatus,
            ciudad=e.ciudad,
            telefono=e.telefono,
        )
        for e in qs
    ]


@router.get("/{estudiante_id}", response=EstudianteDetailOut)
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
        created_at=e.created_at,
        updated_at=e.updated_at,
    )


@router.post("", response=EstudianteDetailOut)
def crear_estudiante(request, payload: EstudianteIn):
    serializer = EstudianteSerializer(data=payload.dict())
    serializer.is_valid(raise_exception=True)
    estudiante = serializer.save()
    return detalle_estudiante(request, estudiante.id)


@router.put("/{estudiante_id}", response=EstudianteDetailOut)
@router.patch("/{estudiante_id}", response=EstudianteDetailOut)
def actualizar_estudiante(request, estudiante_id: int, payload: EstudianteIn):
    estudiante = get_object_or_404(Estudiante, pk=estudiante_id)
    serializer = EstudianteSerializer(instance=estudiante, data=payload.dict(), partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return detalle_estudiante(request, estudiante.id)
