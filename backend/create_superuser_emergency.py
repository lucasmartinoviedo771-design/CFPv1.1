import os
import django
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "academia.settings")
sys.path.append(os.getcwd())
django.setup()

from django.contrib.auth.models import User

def create_rescue_user():
    username = 'soporte'
    password = 'soporte123'
    email = 'soporte@example.com'
    
    print(f"--- Creando/Actualizando usuario '{username}' ---")
    try:
        user, created = User.objects.get_or_create(username=username, defaults={'email': email})
        
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.save()
        
        if created:
            print(f"✅ Usuario creado exitosamente.")
        else:
            print(f"✅ Usuario actualizado exitosamente.")
            
        print(f"🔑 Credenciales: {username} / {password}")
        
    except Exception as e:
        print(f"❌ Error crítico: {e}")

if __name__ == "__main__":
    create_rescue_user()
