from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0011_rename_core_horari_cohorte_d9ec72_idx_core_horari_cohorte_c01b0b_idx_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="horariocursada",
            name="docente",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="horarios_cursada",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddIndex(
            model_name="horariocursada",
            index=models.Index(fields=["docente", "cohorte"], name="core_horari_docente_02950f_idx"),
        ),
    ]
