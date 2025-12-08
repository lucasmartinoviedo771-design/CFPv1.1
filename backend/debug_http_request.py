import os
import django
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "academia.settings")
sys.path.append(os.getcwd())
django.setup()

from django.test import Client

def test_http_login():
    print("--- Probando Login vía HTTP (Django Test Client) ---")
    c = Client()
    try:
        response = c.post('/api/token/', {'username': 'soporte', 'password': 'soporte123'}, HTTP_HOST='127.0.0.1')
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("✅ Login HTTP Exitoso.")
        else:
            print("❌ Falló el login HTTP.")
            print("Respuesta (primeros 500 chars):")
            print(response.content.decode('utf-8')[:500])
    except Exception as e:
        print(f"❌ Excepción durante request: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_http_login()
