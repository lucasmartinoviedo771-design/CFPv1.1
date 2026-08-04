from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from core.models import Estudiante, Inscripcion
from core.services.email_service import enviar_correo_aceptacion_videojuegos
import time

class Command(BaseCommand):
    help = 'Aprobacion masiva de preinscripciones de Videojuegos con envio de correos cada 15 segundos (o delay configurable)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Realizar una prueba sin guardar cambios ni enviar correos',
        )
        parser.add_argument(
            '--delay',
            type=int,
            default=15,
            help='Retraso en segundos entre cada envio (default: 15)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        delay = options['delay']

        # Obtener todos los estudiantes activos con inscripciones en Videojuegos
        qs = Estudiante.objects.filter(
            is_active=True,
            inscripciones__cohorte__programa__codigo='VJ'
        ).distinct().order_by('apellido', 'nombre')

        pendientes = []
        for est in qs:
            vj_ins = [i for i in est.inscripciones.all() if i.cohorte.programa.codigo == 'VJ']
            if vj_ins:
                # Si no está cursando/aprobado/egresado en ningún módulo de VJ y no todos están inactivos/desaprobados/libres
                if not any(i.estado in ['CURSANDO', 'APROBADO', 'EGRESADO'] for i in vj_ins) and not all(i.estado in ['INACTIVO', 'DESAPROBADO', 'LIBRE'] for i in vj_ins):
                    pendientes.append(est)

        total = len(pendientes)
        self.stdout.write(self.style.WARNING(f"Se encontraron {total} preinscripciones de Videojuegos pendientes."))

        if total == 0:
            self.stdout.write(self.style.SUCCESS("No hay preinscripciones de Videojuegos pendientes para procesar."))
            return

        for idx, est in enumerate(pendientes, 1):
            self.stdout.write(f"[{idx}/{total}] Procesando: {est.apellido}, {est.nombre} (DNI: {est.dni}, Email: {est.email})...")

            if dry_run:
                self.stdout.write(self.style.NOTICE(f"[DRY-RUN] Aprobaria a {est.apellido}, {est.nombre} y enviaria correo."))
            else:
                try:
                    with transaction.atomic():
                        # 1. Cambiar estatus a Regular si era Preinscripto
                        if est.estatus == "Preinscripto":
                            est.estatus = "Regular"
                            est.save(update_fields=["estatus", "updated_at"])

                        # 2. Inscribir en Moodle / Cambiar a CURSANDO las inscripciones preinscriptas de VJ
                        Inscripcion.objects.filter(
                            estudiante=est,
                            cohorte__programa__codigo="VJ",
                            estado=Inscripcion.PREINSCRIPTO
                        ).update(
                            estado=Inscripcion.CURSANDO,
                            updated_at=timezone.now()
                        )

                    # 3. Enviar correo (fuera de la transacción para no bloquear la BD si hay fallas de red/correo)
                    success = enviar_correo_aceptacion_videojuegos(est.id)
                    if success:
                        self.stdout.write(self.style.SUCCESS(f"Aprobado e invitado a Discord/Campus por correo."))
                    else:
                        self.stdout.write(self.style.ERROR(f"Aprobado en base de datos, pero falló el envío del correo."))

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error procesando a {est.apellido}, {est.nombre}: {str(e)}"))

            # Dormir entre envios, excepto en el ultimo
            if idx < total and not dry_run:
                self.stdout.write(f"Esperando {delay} segundos antes del siguiente...")
                time.sleep(delay)

        self.stdout.write(self.style.SUCCESS("Proceso de lote finalizado."))
