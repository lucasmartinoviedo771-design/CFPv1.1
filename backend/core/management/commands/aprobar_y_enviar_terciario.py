from django.core.management.base import BaseCommand
from core.models import PreinscripcionTerciario
from core.api.preinscripcion_terciario import _inscribir_hd
import time

class Command(BaseCommand):
    help = 'Aprobacion masiva de preinscripciones de Terciario con envio de correos cada 30 segundos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Realizar una prueba sin guardar cambios ni enviar correos',
        )
        parser.add_argument(
            '--delay',
            type=int,
            default=30,
            help='Retraso en segundos entre cada envio (default: 30)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        delay = options['delay']

        # Obtener preinscripciones pendientes
        pendientes = PreinscripcionTerciario.objects.exclude(estado='aprobada')
        total = pendientes.count()
        
        self.stdout.write(self.style.WARNING(f"Se encontraron {total} preinscripciones de Terciario pendientes."))

        if total == 0:
            self.stdout.write(self.style.SUCCESS("No hay preinscripciones pendientes para procesar."))
            return

        for idx, p in enumerate(pendientes, 1):
            self.stdout.write(f"[{idx}/{total}] Procesando: {p.apellido}, {p.nombre} (DNI: {p.dni}, Email: {p.email})...")
            
            if dry_run:
                self.stdout.write(self.style.NOTICE(f"[DRY-RUN] Aprobaria a {p.apellido}, {p.nombre} y enviaria correo."))
            else:
                try:
                    # 1. Marcar como aprobada
                    p.estado = 'aprobada'
                    p.save(update_fields=['estado'])
                    
                    # 2. Inscribir en Moodle / Habilidades Digitales (esto tambien envia el segundo correo)
                    _inscribir_hd(p)
                    
                    self.stdout.write(self.style.SUCCESS(f"Aprobado e inscrito exitosamente."))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error procesando a {p.apellido}, {p.nombre}: {str(e)}"))

            # Dormir entre envios, excepto en el ultimo
            if idx < total and not dry_run:
                self.stdout.write(f"Esperando {delay} segundos antes del siguiente...")
                time.sleep(delay)

        self.stdout.write(self.style.SUCCESS("Proceso de lote finalizado."))
