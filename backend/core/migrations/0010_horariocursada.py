from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0009_alter_semanaconfig_tipo"),
    ]

    operations = [
        migrations.CreateModel(
            name="HorarioCursada",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "dia_semana",
                    models.CharField(
                        choices=[
                            ("LUNES", "Lunes"),
                            ("MARTES", "Martes"),
                            ("MIERCOLES", "Miércoles"),
                            ("JUEVES", "Jueves"),
                            ("VIERNES", "Viernes"),
                            ("SABADO", "Sábado"),
                            ("DOMINGO", "Domingo"),
                        ],
                        max_length=10,
                    ),
                ),
                ("hora_inicio", models.TimeField()),
                ("hora_fin", models.TimeField()),
                (
                    "bloque",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="horarios", to="core.bloque"),
                ),
                (
                    "cohorte",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="horarios", to="core.cohorte"),
                ),
                (
                    "modulo",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="horarios", to="core.modulo"),
                ),
            ],
            options={
                "ordering": ["cohorte_id", "bloque_id", "modulo_id", "dia_semana", "hora_inicio"],
            },
        ),
        migrations.AddConstraint(
            model_name="horariocursada",
            constraint=models.UniqueConstraint(
                fields=("cohorte", "bloque", "modulo", "dia_semana", "hora_inicio", "hora_fin"),
                name="uniq_horario_cursada",
            ),
        ),
        migrations.AddIndex(
            model_name="horariocursada",
            index=models.Index(fields=["cohorte", "dia_semana"], name="core_horari_cohorte_d9ec72_idx"),
        ),
        migrations.AddIndex(
            model_name="horariocursada",
            index=models.Index(fields=["bloque", "modulo"], name="core_horari_bloque__3ca655_idx"),
        ),
    ]
