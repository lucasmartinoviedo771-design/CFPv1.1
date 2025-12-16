#!/usr/bin/env python3
"""
Script para enviar credenciales por email a usuarios de CFP

Características:
- Envío por lotes con rate limiting  
- Evita bloqueos por spam
- Log detallado de envíos
- Soporte para Cloudflare Email Routing y Gmail
- Aplica a cualquier usuario con temp_password

Uso:
    python scripts/enviar_credenciales.py --limite 50
    python scripts/enviar_credenciales.py --limite 100 --delay 10 --dry-run
    python scripts/enviar_credenciales.py --grupo docente --limite 10
"""

import sys
import os
import time
import argparse
from pathlib import Path
from datetime import datetime

# Agregar el backend al path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Configurar Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "academia.settings")
import django
django.setup()

from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User
from core.models import UserProfile
from django.utils import timezone


def generar_email_usuario(nombre, apellido, username, password):
    """Genera el contenido del email para un usuario"""
    asunto = "Credenciales de acceso - Sistema CFP"
    
    # Obtener la URL del frontend desde settings o usar un valor por defecto
    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://cfp.lucasoviedodev.org')
    
    cuerpo = f"""
Hola {nombre} {apellido},

Te damos la bienvenida al Sistema de Gestión CFP.

Tus credenciales de acceso son:

🔐 Usuario: {username}
🔑 Contraseña: {password}

🌐 Link de acceso: {frontend_url}/login

IMPORTANTE:
- Por seguridad, deberás cambiar tu contraseña en el primer inicio de sesión.
- Guarda estas credenciales en un lugar seguro.
- Si tienes problemas para acceder, contacta a soporte.

Saludos cordiales,
Centro de Formación Profesional
    """
    
    return asunto, cuerpo


def enviar_correos_usuarios(limite=50, delay=5, dry_run=False, grupo=None):
    """
    Envía credenciales a usuarios que tienen temp_password almacenada
    
    Args:
        limite: Número máximo de correos a enviar en esta ejecución
        delay: Segundos de espera entre cada envío
        dry_run: Si es True, solo simula el envío sin enviar realmente
        grupo: Nombre del grupo para filtrar (ej: 'docente', 'staff'), None para todos
    """
    print(f"🔍 Buscando usuarios que necesitan recibir credenciales...")
    if grupo:
        print(f"   Filtrando por grupo: {grupo}")
    print(f"Configuración: límite={limite}, delay={delay}s, dry_run={dry_run}")
    print("-" * 60)
    
    # Buscar userprofiles con temp_password y que no hayan recibido credenciales aún
    query = UserProfile.objects.filter(
        temp_password__isnull=False,
        credentials_sent_at__isnull=True
    ).exclude(temp_password='')
    
    # Filtrar por grupo si se especifica
    if grupo:
        query = query.filter(user__groups__name=grupo)
    
    profiles = query.select_related('user')[:limite]
    
    total = profiles.count()
    
    if total == 0:
        msg = f"✅ No hay usuarios pendientes de envío de credenciales"
        if grupo:
            msg += f" (grupo: {grupo})"
        print(msg + ".")
        return
    
    print(f"📧 Se enviarán {total} correos.")
    print()
    
    stats = {
        "enviados": 0,
        "fallidos": 0,
        "errores": []
    }
    
    for i, profile in enumerate(profiles, 1):
        user = profile.user
        username = user.username
        temp_password = profile.temp_password
        
        if not user.email:
            print(f"  ⏭️  {i}/{total} - Usuario {username} no tiene email, omitido")
            continue
        
        # Preparar el email
        asunto, cuerpo = generar_email_usuario(
            user.first_name or "Usuario",
            user.last_name or "",
            username,
            temp_password
        )
        
        if dry_run:
            grupos = ", ".join([g.name for g in user.groups.all()]) or "sin grupo"
            print(f"  🧪 {i}/{total} - [DRY RUN] {user.last_name}, {user.first_name} ({user.email})")
            print(f"       Grupos: {grupos} | Contraseña: {temp_password}")
            stats["enviados"] += 1
        else:
            try:
                # Enviar el correo
                send_mail(
                    subject=asunto,
                    message=cuerpo,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                
                # Marcar como enviado
                profile.credentials_sent_at = timezone.now()
                # Opcional: borrar temp_password después del envío
                # profile.temp_password = None
                profile.save()
                
                stats["enviados"] += 1
                print(f"  ✅ {i}/{total} - {user.last_name}, {user.first_name} ({user.email})")
                
                # Delay entre envíos para evitar rate limiting
                if i < total and delay > 0:
                    time.sleep(delay)
                    
            except Exception as e:
                stats["fallidos"] += 1
                error_msg = f"{user.last_name}, {user.first_name} ({user.email}): {str(e)}"
                stats["errores"].append(error_msg)
                print(f"  ❌ {i}/{total} - Error: {error_msg}")
    
    print()
    print("=" * 60)
    print("📊 RESUMEN")
    print("=" * 60)
    print(f"✅ Enviados:  {stats['enviados']}")
    print(f"❌ Fallidos:  {stats['fallidos']}")
    
    if stats["errores"]:
        print()
        print("Errores:")
        for error in stats["errores"][:10]:  # Mostrar solo los primeros 10
            print(f"  - {error}")
    
    print("=" * 60)
    
    return stats


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Enviar credenciales por email a usuarios de CFP")
    parser.add_argument(
        "--limite",
        type=int,
        default=50,
        help="Número máximo de correos a enviar (default: 50)"
    )
    parser.add_argument(
        "--delay",
        type=int,
        default=5,
        help="Segundos de espera entre cada envío (default: 5)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Modo simulación - no envía emails realmente"
    )
    parser.add_argument(
        "--grupo",
        type=str,
        default=None,
        help="Filtrar por grupo de usuarios (ej: 'docente', 'staff')"
    )
    
    args = parser.parse_args()
    
    enviar_correos_usuarios(
        limite=args.limite,
        delay=args.delay,
        dry_run=args.dry_run,
        grupo=args.grupo
    )
