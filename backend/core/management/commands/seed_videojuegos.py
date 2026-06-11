from django.core.management.base import BaseCommand
from core.models import Programa, Bloque, Modulo, Cohorte, BloqueDeFechas
from datetime import date

class Command(BaseCommand):
    help = "Seeds the Videojuegos program blocks, modules and cohortes."

    def handle(self, *args, **options):
        self.stdout.write("Iniciando seed de Videojuegos...")

        # 1. Obtener o crear el Programa (renombrar código a VJ)
        programa = Programa.objects.filter(id=9).first()
        if not programa:
            programa = Programa.objects.filter(codigo="CPDVJ").first()
        if not programa:
            programa, created = Programa.objects.get_or_create(
                codigo="VJ",
                defaults={"nombre": "Certificación Profesional en Desarrollo de Videojuegos", "activo": True, "requiere_titulo_secundario": True}
            )
        else:
            programa.codigo = "VJ"
            programa.nombre = "Certificación Profesional en Desarrollo de Videojuegos"
            programa.requiere_titulo_secundario = True
            programa.save()
            self.stdout.write(f"Programa actualizado: {programa}")

        # 2. Definir los bloques
        bloques_def = [
            "Arte y Animación",
            "Programación de Entornos Virtuales",
            "Producción de Videojuegos",
            "Inteligencia Artificial",
            "Diseño de Videojuegos"
        ]

        # 3. Obtener una plantilla de fechas (id=1 o la primera disponible)
        bloque_fechas = BloqueDeFechas.objects.filter(id=1).first() or BloqueDeFechas.objects.first()
        if not bloque_fechas:
            self.stdout.write(self.style.ERROR("No se encontró ningún BloqueDeFechas. Por favor, crea uno primero."))
            return

        for nombre_bloque in bloques_def:
            # Crear Bloque
            bloque, b_created = Bloque.objects.get_or_create(
                programa=programa,
                nombre=nombre_bloque
            )
            if b_created:
                self.stdout.write(f"Bloque creado: {nombre_bloque}")

            # Crear Módulo por defecto para que funcione el motor de inscripción
            modulo, m_created = Modulo.objects.get_or_create(
                bloque=bloque,
                nombre=f"Módulo Único - {nombre_bloque}",
                defaults={"es_practica": False, "asistencia_requerida_practica": 80}
            )
            if m_created:
                self.stdout.write(f"  - Módulo creado para {nombre_bloque}")

            # Crear Cohorte con fecha_inicio=2026-06-25, fecha_fin=2026-07-31
            cohorte_nombre = f"VJ - {nombre_bloque} 2026"
            cohorte, c_created = Cohorte.objects.get_or_create(
                programa=programa,
                bloque=bloque,
                nombre=cohorte_nombre,
                defaults={
                    "fecha_inicio": date(2026, 6, 25),
                    "fecha_fin": date(2026, 7, 31),
                    "bloque_fechas": bloque_fechas
                }
            )
            if c_created:
                self.stdout.write(f"  - Cohorte creada: {cohorte_nombre}")
            else:
                # Asegurar fechas correctas si ya existía
                cohorte.fecha_inicio = date(2026, 6, 25)
                cohorte.fecha_fin = date(2026, 7, 31)
                cohorte.save(update_fields=["fecha_inicio", "fecha_fin"])
                self.stdout.write(f"  - Cohorte existente actualizada: {cohorte_nombre}")

        self.stdout.write(self.style.SUCCESS("Seed de Videojuegos finalizado con éxito."))
