import os
import django
import sys

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "academia.settings")
sys.path.append(os.getcwd()) # Add current directory to path
django.setup()

from django.db import connection
from django.db.utils import OperationalError

def check_db():
    print("--- Probando conexión a Base de Datos ---")
    try:
        c = connection.cursor()
        print("✅ Conexión exitosa a la base de datos.")
        c.execute("SELECT VERSION()")
        version = c.fetchone()
        print(f"ℹ️ Versión de DB: {version[0]}")
        
        c.execute("SHOW TABLES LIKE 'auth_user'")
        if c.fetchone():
            print("✅ Tabla auth_user existe.")
            
            c.execute("SELECT count(*) FROM auth_user")
            count = c.fetchone()[0]
            print(f"ℹ️ Usuarios encontrados: {count}")
        else:
            print("❌ Tabla auth_user NO encontrada. ¿Faltan migraciones?")
            
    except OperationalError as e:
        print(f"❌ Error de conexión: {e}")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

if __name__ == "__main__":
    check_db()
