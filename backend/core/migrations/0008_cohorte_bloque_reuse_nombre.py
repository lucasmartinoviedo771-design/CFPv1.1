from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0007_alter_bloque_options_alter_cohorte_options_and_more"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name="cohorte",
                    name="bloque",
                    field=models.ForeignKey(
                        blank=True,
                        help_text="Bloque académico al que aplica esta cohorte",
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="cohortes",
                        to="core.bloque",
                    ),
                ),
            ],
        ),
        migrations.AlterField(
            model_name="cohorte",
            name="nombre",
            field=models.CharField(max_length=100),
        ),
        migrations.AddConstraint(
            model_name="cohorte",
            constraint=models.UniqueConstraint(
                fields=("programa", "bloque", "nombre"),
                name="uniq_cohorte_programa_bloque_nombre",
            ),
        ),
    ]
