from django.core.management.base import BaseCommand

from core.models import Estudiante
from core.utils.estudiante_normalization import (
    normalize_country_with_other,
    normalize_dni_digits,
    normalize_sexo,
    normalize_spaces,
    to_title_case,
    to_upper,
)


class Command(BaseCommand):
    help = "Estandariza formato de estudiantes existentes (DNI, nombre, ubicacion, etc.)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Muestra cambios sin guardar en base de datos.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        total = 0
        changed = 0
        warnings = 0

        update_fields = [
            "apellido",
            "nombre",
            "dni",
            "sexo",
            "pais_nacimiento",
            "pais_nacimiento_otro",
            "nacionalidad",
            "nacionalidad_otra",
            "lugar_nacimiento",
            "domicilio",
            "ciudad",
            "barrio",
            "lugar_trabajo",
            "email",
        ]

        batch_to_update = []
        allowed_sexo = {"", "Masculino", "Femenino", "Otro"}

        for est in Estudiante.objects.all().iterator():
            total += 1
            original = {field: getattr(est, field) for field in update_fields}

            est.apellido = to_upper(est.apellido)
            est.nombre = to_title_case(est.nombre)
            est.email = normalize_spaces(est.email).lower()

            dni_digits = normalize_dni_digits(est.dni)
            if len(dni_digits) == 8:
                est.dni = dni_digits
            elif dni_digits:
                warnings += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"[WARN] ID {est.id} DNI no estandarizable a 8 digitos: '{est.dni}' -> '{dni_digits}'"
                    )
                )

            est.sexo = normalize_sexo(est.sexo)
            if est.sexo not in allowed_sexo:
                warnings += 1
                self.stdout.write(
                    self.style.WARNING(f"[WARN] ID {est.id} sexo fuera de catalogo: '{est.sexo}'")
                )

            if est.pais_nacimiento:
                pais, otro = normalize_country_with_other(est.pais_nacimiento)
                est.pais_nacimiento = pais
                if pais == "Otro":
                    est.pais_nacimiento_otro = to_title_case(
                        est.pais_nacimiento_otro or otro
                    )
                else:
                    est.pais_nacimiento_otro = ""
            else:
                est.pais_nacimiento_otro = to_title_case(est.pais_nacimiento_otro)

            if est.nacionalidad:
                nac, otro = normalize_country_with_other(est.nacionalidad)
                est.nacionalidad = nac
                if nac == "Otro":
                    est.nacionalidad_otra = to_title_case(est.nacionalidad_otra or otro)
                else:
                    est.nacionalidad_otra = ""
            else:
                est.nacionalidad_otra = to_title_case(est.nacionalidad_otra)

            est.lugar_nacimiento = to_title_case(est.lugar_nacimiento)
            est.domicilio = to_title_case(est.domicilio)
            est.ciudad = to_title_case(est.ciudad)
            est.barrio = to_title_case(est.barrio)
            est.lugar_trabajo = to_title_case(est.lugar_trabajo)

            has_changes = any(
                original[field] != getattr(est, field) for field in update_fields
            )
            if has_changes:
                changed += 1
                batch_to_update.append(est)

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"[DRY RUN] total={total} cambiados={changed} warnings={warnings}"
                )
            )
            return

        if batch_to_update:
            Estudiante.objects.bulk_update(batch_to_update, update_fields)

        self.stdout.write(
            self.style.SUCCESS(
                f"[OK] total={total} cambiados={changed} warnings={warnings}"
            )
        )
