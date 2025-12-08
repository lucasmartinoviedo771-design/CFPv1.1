import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "academia.settings")
django.setup()

User = get_user_model()
username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'soporte')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'soporte@admin.com')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'soporte123')

if not User.objects.filter(username=username).exists():
    print(f"Creando superusuario {username}...")
    User.objects.create_superuser(username, email, password)
    print("Superusuario creado.")
else:
    print(f"El superusuario {username} ya existe.")
