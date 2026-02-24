from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0008_cohorte_bloque_reuse_nombre"),
    ]

    operations = [
        migrations.AlterField(
            model_name="semanaconfig",
            name="tipo",
            field=models.CharField(
                choices=[
                    ("CLASE", "Clase"),
                    ("PARCIAL", "Parcial"),
                    ("FINAL_VIRTUAL", "Final Virtual"),
                    ("FINAL_SINC", "Final Sincrónico"),
                    ("SIN_ACTIVIDADES", "Sin Actividades"),
                ],
                max_length=20,
            ),
        ),
    ]
