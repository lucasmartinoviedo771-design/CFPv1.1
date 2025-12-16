# Generated manually on 2025-12-15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_alter_estudiante_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='credentials_sent_at',
            field=models.DateTimeField(blank=True, help_text='Fecha y hora en que se enviaron las credenciales por email', null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='temp_password',
            field=models.CharField(blank=True, help_text='Contraseña temporal para envío por email (se borra después del primer login o envío)', max_length=128, null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='must_change_password',
            field=models.BooleanField(default=True, help_text='Si está activo, el usuario debe cambiar la contraseña al iniciar sesión.'),
        ),
        migrations.AlterModelOptions(
            name='userprofile',
            options={'verbose_name': 'Perfil de Usuario', 'verbose_name_plural': 'Perfiles de Usuario'},
        ),
    ]
