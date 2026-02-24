from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0012_horariocursada_docente_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="estudiante",
            name="titulo_secundario_digitalizado",
            field=models.URLField(
                blank=True,
                max_length=500,
                verbose_name="Título secundario digitalizado (Link)",
            ),
        ),
        migrations.AddField(
            model_name="programa",
            name="requiere_titulo_secundario",
            field=models.BooleanField(
                default=False,
                help_text="Indica si para este programa se debe adjuntar título secundario.",
            ),
        ),
    ]
