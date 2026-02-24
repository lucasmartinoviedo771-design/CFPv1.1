from django.db import migrations, models
import core.models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0013_programa_requiere_titulo_and_estudiante_titulo_doc"),
    ]

    operations = [
        migrations.AlterField(
            model_name="estudiante",
            name="dni_digitalizado",
            field=models.FileField(
                blank=True,
                upload_to=core.models.dni_upload_path,
                verbose_name="DNI digitalizado (Archivo)",
            ),
        ),
        migrations.AlterField(
            model_name="estudiante",
            name="titulo_secundario_digitalizado",
            field=models.FileField(
                blank=True,
                upload_to=core.models.titulo_upload_path,
                verbose_name="Título secundario digitalizado (Archivo)",
            ),
        ),
    ]
