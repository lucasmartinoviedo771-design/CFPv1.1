from django.core.management.base import BaseCommand
from core.models import Nota, Examen, Inscripcion, Cohorte, Modulo

class Command(BaseCommand):
    help = 'Procesa la progresión histórica de notas de parciales aprobadas para matricular módulos siguientes'

    def handle(self, *args, **options):
        notas_aprobadas = Nota.objects.filter(
            examen__tipo_examen=Examen.PARCIAL, 
            aprobado=True,
            examen__modulo__isnull=False
        )
        
        count = 0
        for nota in notas_aprobadas:
            estudiante = nota.estudiante
            modulo_actual = nota.examen.modulo
            bloque = modulo_actual.bloque
            
            # Buscar la inscripción actual del estudiante al módulo que aprobó
            insc_actual = Inscripcion.objects.filter(
                estudiante=estudiante,
                modulo=modulo_actual
            ).order_by('-created_at').first()
            
            if insc_actual:
                cohorte_actual = insc_actual.cohorte
                
                # Buscar la siguiente cohorte (en el tiempo) para este mismo programa/bloque
                siguiente_cohorte = Cohorte.objects.filter(
                    programa=cohorte_actual.programa,
                    bloque=bloque,
                    fecha_inicio__gt=cohorte_actual.fecha_inicio
                ).order_by('fecha_inicio').first()
                
                if siguiente_cohorte:
                    # Buscar el siguiente módulo en el mismo bloque
                    modulo_destino = Modulo.objects.filter(
                        bloque=bloque,
                        id__gt=modulo_actual.id
                    ).order_by('id').first()
                    
                    if modulo_destino:
                        # Crear la inscripción automáticamente (si no existe ya)
                        insc, created = Inscripcion.objects.get_or_create(
                            estudiante=estudiante,
                            cohorte=siguiente_cohorte,
                            modulo=modulo_destino,
                            defaults={'estado': Inscripcion.INSCRIPTO}
                        )
                        if created:
                            self.stdout.write(self.style.SUCCESS(f'Inscrito: {estudiante} al {modulo_destino} en la {siguiente_cohorte}'))
                            count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Terminado. Se crearon {count} inscripciones nuevas progresivas.'))
