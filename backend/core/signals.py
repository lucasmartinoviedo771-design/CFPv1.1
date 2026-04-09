import os
from django.contrib.auth.models import User
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import UserProfile, Estudiante, Bloque, Modulo, Cohorte


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # Ensure profile exists
    if not hasattr(instance, 'profile'):
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_delete, sender=Estudiante)
def delete_estudiante_files(sender, instance, **kwargs):
    """
    Elimina los archivos del disco cuando se borra el registro del Estudiante.
    """
    file_fields = [
        instance.dni_digitalizado,
        instance.titulo_secundario_digitalizado,
        instance.dni_tutor_digitalizado,
        instance.nota_parental_firmada,
    ]
    for file_field in file_fields:
        if file_field and hasattr(file_field, 'path'):
            if os.path.isfile(file_field.path):
                try:
                    os.remove(file_field.path)
                except Exception as e:
                    print(f"Error eliminando archivo {file_field.path}: {e}")


@receiver(post_save, sender=Estudiante)
def activate_inscripciones_on_regular(sender, instance, created, **kwargs):
    """
    Cuando un estudiante pasa a ser 'Regular', activamos sus inscripciones
    que estén en estado 'INSCRIPTO'.
    """
    if instance.estatus == 'Regular':
        from .models import Inscripcion
        Inscripcion.objects.filter(
            estudiante=instance,
            estado=Inscripcion.PREINSCRIPTO
        ).update(estado=Inscripcion.CURSANDO)


@receiver(post_save, sender=Cohorte)
def create_exams_from_template(sender, instance, created, **kwargs):
    """
    Cuando se crea o actualiza una Cohorte, revisamos su plantilla de calendario (bloque_fechas).
    Si la plantilla incluye semanas de examen, aseguramos que existan los registros
    de Examen para el Bloque o sus Módulos.
    """
    from .models import Examen, SemanaConfig
    
    if not instance.bloque_fechas:
        return

    # Obtenemos los tipos de semana definidos en la plantilla
    tipos_semana = instance.bloque_fechas.semanas_config.values_list('tipo', flat=True).distinct()

    # Si la plantilla tiene FINAL_VIRTUAL, aseguramos que exista en el bloque
    if SemanaConfig.FINAL_VIRTUAL in tipos_semana and instance.bloque:
        Examen.objects.get_or_create(bloque=instance.bloque, tipo_examen=Examen.FINAL_VIRTUAL)

    # Si tiene FINAL_SINC, aseguramos que exista en el bloque
    if SemanaConfig.FINAL_SINC in tipos_semana and instance.bloque:
        Examen.objects.get_or_create(bloque=instance.bloque, tipo_examen=Examen.FINAL_SINC)
    
    # El tipo EQUIVALENCIA siempre lo creamos por bloque si hay finales o si se requiere
    if (SemanaConfig.FINAL_VIRTUAL in tipos_semana or SemanaConfig.FINAL_SINC in tipos_semana) and instance.bloque:
        Examen.objects.get_or_create(bloque=instance.bloque, tipo_examen=Examen.EQUIVALENCIA)

    # Si tiene PARCIAL, aseguramos que todos los módulos del bloque tengan su examen parcial
    if SemanaConfig.PARCIAL in tipos_semana and instance.bloque:
        for modulo in instance.bloque.modulos.all():
            Examen.objects.get_or_create(modulo=modulo, tipo_examen=Examen.PARCIAL)
