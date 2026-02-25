# backend/core/management/commands/seed_examenes.py
from django.core.management.base import BaseCommand
from core.models import Bloque, Modulo, Examen
from django.utils import timezone

class Command(BaseCommand):
    help = "Crea exámenes base (Parcial, Final Virtual/Sinc) para toda la estructura académica."

    def handle(self, *args, **opts):
        created_count = 0
        
        # 1. Exámenes por Módulo (Parcial y Recuperatorio)
        modulos = Modulo.objects.all()
        for m in modulos:
            # Parcial
            ex, created = Examen.objects.get_or_create(
                modulo=m,
                tipo_examen=Examen.PARCIAL,
                defaults={'fecha': timezone.now().date()}
            )
            if created: created_count += 1
            
            # Recuperatorio
            ex, created = Examen.objects.get_or_create(
                modulo=m,
                tipo_examen=Examen.RECUP,
                defaults={'fecha': timezone.now().date()}
            )
            if created: created_count += 1

        # 2. Exámenes por Bloque (Finales y Equivalencia)
        bloques = Bloque.objects.all()
        for b in bloques:
            # Final Virtual
            ex, created = Examen.objects.get_or_create(
                bloque=b,
                tipo_examen=Examen.FINAL_VIRTUAL,
                defaults={'fecha': timezone.now().date()}
            )
            if created: created_count += 1
            
            # Final Sincrónico
            ex, created = Examen.objects.get_or_create(
                bloque=b,
                tipo_examen=Examen.FINAL_SINC,
                defaults={'fecha': timezone.now().date()}
            )
            if created: created_count += 1
            
            # Equivalencia
            ex, created = Examen.objects.get_or_create(
                bloque=b,
                tipo_examen=Examen.EQUIVALENCIA,
                defaults={'fecha': timezone.now().date()}
            )
            if created: created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Se crearon/verificaron {created_count} exámenes base."))
