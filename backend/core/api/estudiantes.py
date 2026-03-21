from typing import List, Optional

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from ninja import Router, Schema, File, UploadedFile
from django.http import HttpResponse
from core.api.permissions import require_authenticated_group
from core.models import Estudiante, Inscripcion, Nota
from core.serializers import EstudianteSerializer
from core.services.email_service import enviar_correo_bienvenida
from core.services.export_service import ExportService
from .schemas import EstudianteOut, EstudianteDetailOut, EstudianteIn

class BulkIdsIn(Schema):
    ids: List[int]

class ExportIn(Schema):
    search: Optional[str] = None
    dni: Optional[str] = None
    estatus: Optional[str] = None
    anio: Optional[int] = None
    columns: List[str]
    format: str = "excel" # "excel" or "pdf"

router = Router(tags=["estudiantes"])


@router.get("", response=List[EstudianteDetailOut])
@require_authenticated_group
def listar_estudiantes(
    request, 
    search: Optional[str] = None, 
    dni: Optional[str] = None, 
    estatus: Optional[str] = None, 
    anio: Optional[int] = None,
    cohorte_id: Optional[int] = None,
    bloque_id: Optional[int] = None,
    modulo_id: Optional[int] = None,
):
    qs = Estudiante.objects.all().prefetch_related(
        "inscripciones__cohorte__programa", "inscripciones__cohorte__bloque"
    ).order_by("apellido", "nombre")
    if dni:
        qs = qs.filter(dni__iexact=dni)
    if estatus:
        qs = qs.filter(estatus=estatus)
    if anio:
        qs = qs.filter(created_at__year=anio)
    if search:
        qs = qs.filter(
            Q(apellido__icontains=search)
            | Q(nombre__icontains=search)
            | Q(email__icontains=search)
            | Q(dni__icontains=search)
        )
    if cohorte_id:
        qs = qs.filter(inscripciones__cohorte_id=cohorte_id).distinct()
    if bloque_id:
        qs = qs.filter(Q(inscripciones__modulo__bloque_id=bloque_id) | Q(inscripciones__cohorte__bloque_id=bloque_id)).distinct()
    if modulo_id:
        qs = qs.filter(inscripciones__modulo_id=modulo_id).distinct()
    return qs


@router.post("/export/")
@require_authenticated_group
def export_estudiantes(request, payload: ExportIn):
    # 1. Filtrar estudiantes (misma lógica que listar)
    qs = Estudiante.objects.all().prefetch_related(
        "inscripciones__modulo",
        "notas__examen__modulo"
    )
    if payload.dni:
        qs = qs.filter(dni__iexact=payload.dni)
    if payload.estatus:
        qs = qs.filter(estatus=payload.estatus)
    if payload.anio:
        qs = qs.filter(created_at__year=payload.anio)
    if payload.search:
        qs = qs.filter(
            Q(apellido__icontains=payload.search)
            | Q(nombre__icontains=payload.search)
            | Q(email__icontains=payload.search)
            | Q(dni__icontains=payload.search)
        )
    
    # 2. Preparar datos
    data = []
    for est in qs:
        # Calcular materias de forma eficiente (usando los datos prefetcheados)
        inscripciones_repo = list(est.inscripciones.all())
        notas_repo = list(est.notas.all())

        # Materias aprobadas: Modulos con nota aprobada
        aprobadas_set = set()
        for n in notas_repo:
            if n.aprobado and n.examen and n.examen.modulo:
                aprobadas_set.add(n.examen.modulo.nombre)
        aprobadas_list = sorted(list(aprobadas_set))
        
        # Materias cursando: Inscripciones en estado CURSANDO
        cursando_list = sorted(list(set([
            i.modulo.nombre for i in inscripciones_repo 
            if i.estado == "CURSANDO" and i.modulo
        ])))
        
        # Materias pendientes: Módulos inscriptos que no están aprobados
        pendientes = sorted(list(set(cursando_list) - set(aprobadas_list)))
        
        # Fecha de inscripción: la más antigua de sus inscripciones o created_at
        fecha_insc_dt = est.created_at
        for i in inscripciones_repo:
            if i.created_at < fecha_insc_dt:
                fecha_insc_dt = i.created_at
        fecha_insc = fecha_insc_dt.date().isoformat()

        row = {
            "id": est.id,
            "apellido": est.apellido,
            "nombre": est.nombre,
            "dni": est.dni,
            "email": est.email,
            "telefono": est.telefono,
            "ciudad": est.ciudad,
            "estatus": est.estatus,
            "fecha_nacimiento": est.fecha_nacimiento.isoformat() if est.fecha_nacimiento else "",
            "fecha_inscripcion": fecha_insc,
            "materias_aprobadas": aprobadas_list,
            "materias_cursando": cursando_list,
            "materias_pendientes": pendientes,
        }
        data.append(row)

    column_labels = {
        "apellido": "Apellido",
        "nombre": "Nombre",
        "dni": "DNI",
        "email": "Email",
        "telefono": "Teléfono",
        "ciudad": "Ciudad",
        "estatus": "Estatus",
        "fecha_nacimiento": "Fecha Nac.",
        "fecha_inscripcion": "Fecha Inscripción",
        "materias_aprobadas": "Módulos Aprobados",
        "materias_cursando": "Módulos Cursando",
        "materias_pendientes": "Módulos Pendientes",
    }

    # 3. Generar archivo
    format_type = payload.format.lower()
    if format_type == "pdf":
        content = ExportService.generate_pdf(data, payload.columns, column_labels)
        response = HttpResponse(content, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="estudiantes.pdf"'
        return response
    else:
        content = ExportService.generate_excel(data, payload.columns, column_labels)
        response = HttpResponse(content, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="estudiantes.xlsx"'
        return response


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
