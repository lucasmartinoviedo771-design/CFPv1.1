from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0005_add_evaluacion_control_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="cohorte",
            name="fecha_fin",
            field=models.DateField(
                blank=True,
                help_text="Fecha de fin calculada o definida para la cohorte",
                null=True,
            ),
        ),
    ]

