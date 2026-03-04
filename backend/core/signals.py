import os
from django.contrib.auth.models import User
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import UserProfile, Estudiante


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
def activate_inscripciones_on_regular(sender, instance, **kwargs):
    """
    Cuando un estudiante pasa a ser 'Regular', activamos sus inscripciones
    que estén en estado 'INSCRIPTO'.
    """
    if instance.estatus == 'Regular':
        from .models import Inscripcion
        Inscripcion.objects.filter(
            estudiante=instance,
            estado=Inscripcion.INSCRIPTO
        ).update(estado=Inscripcion.ACTIVO)
