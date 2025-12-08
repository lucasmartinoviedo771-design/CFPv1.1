import os
import django
import sys

# Configurar entorno Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "academia.settings")
sys.path.append(os.getcwd())
django.setup()

from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
import traceback

def test_jwt_generation():
    print("--- Probando Generación de Token JWT ---")
    try:
        # Buscar usuario soporte
        user = User.objects.get(username='soporte')
        print(f"✅ Usuario encontrado: {user.username}")
        
        # Intentar generar token
        print("⏳ Generando token...")
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        
        print(f"✅ Token generado exitosamente!")
        print(f"Access Token (first 20 chars): {access[:20]}...")
        
    except Exception:
        print("❌ Error FATAL generando token:")
        traceback.print_exc()

if __name__ == "__main__":
    test_jwt_generation()
