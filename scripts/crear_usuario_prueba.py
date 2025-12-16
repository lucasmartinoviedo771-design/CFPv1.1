#!/usr/bin/env python3
"""
Script para crear un usuario de prueba con contraseña automática (para docentes/staff)

Uso:
    python scripts/crear_usuario_prueba.py
"""

import sys
import os
from pathlib import Path

# Agregar el backend al path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Configurar Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "academia.settings")
import django
django.setup()


from django.contrib.auth.models import User, Group
from core.models import UserProfile
import secrets
import string


def generar_contraseña_segura(longitud=12):
    """Genera una contraseña aleatoria segura"""
    caracteres = string.ascii_letters + string.digits + "!@#$%&"
    return ''.join(secrets.choice(caracteres) for _ in range(longitud))


def crear_usuario_prueba():
    """
    Crea un usuario de prueba con contraseña automática (docente)
    """
    print("📝 Creando usuario de prueba (docente)...")
    print("-" * 60)
    
    # Datos del usuario de prueba
    dni = "88888888"
    email = "docente.prueba@ejemplo.com"  # CAMBIAR por email real para probar
    nombre = "Docente"
    apellido = "Prueba"
    
    # Verificar si ya existe
    if User.objects.filter(username=dni).exists():
        print(f"⚠️  El usuario con DNI {dni} ya existe.")
        print("   Borrando para crear uno nuevo...")
        user = User.objects.get(username=dni)
        if hasattr(user, 'profile'):
            user.profile.delete()
        user.delete()
    
    # Generar contraseña
    password = generar_contraseña_segura()
    
    # Crear usuario
    user = User.objects.create_user(
        username=dni,
        email=email,
        password=password,
        first_name=nombre,
        last_name=apellido
    )
    
    # Agregar al grupo "docente"
    grupo_docente, _ = Group.objects.get_or_create(name="docente")
    user.groups.add(grupo_docente)
    user.save()
    
    # Crear perfil con contraseña temporal
    profile = UserProfile.objects.create(
        user=user,
        must_change_password=True,
        temp_password=password
    )
    
    print("=" * 60)
    print("✅ USUARIO DOCENTE CREADO EXITOSAMENTE")
    print("=" * 60)
    print(f"DNI/Usuario:  {dni}")
    print(f"Nombre:       {apellido}, {nombre}")
    print(f"Email:        {email}")
    print(f"Grupo:        docente")
    print(f"Contraseña:   {password}")
    print("-" * 60)
    print(f"UserProfile ID:      {profile.id}")
    print(f"Must Change Password: {profile.must_change_password}")
    print(f"Temp Password:       {profile.temp_password}")
    print(f"Credentials Sent:    {profile.credentials_sent_at}")
    print("=" * 60)
    print()
    print("📧 Para enviar las credenciales, ejecuta:")
    print("   docker compose exec backend python scripts/enviar_credenciales.py --dry-run --limite 1")
    print()
    print("   O para filtrar solo docentes:")
    print("   docker compose exec backend python scripts/enviar_credenciales.py --grupo docente --dry-run")
    print()
    print("⚠️  IMPORTANTE: Cambia el email a uno real para recibir el correo de prueba")
    print()
    
    return {
        "user": user,
        "profile": profile,
        "password": password
    }


if __name__ == "__main__":
    crear_usuario_prueba()

