from typing import List
from django.contrib.auth.models import User, Group
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from ninja import Router

from core.serializers import UserSerializer, GroupSerializer
from core.api.permissions import require_admin
from core.api.schemas import UserIn, UserOut, ChangePasswordIn
from core.models import UserProfile
from ninja.errors import HttpError

router = Router(tags=["users"])


def _ensure_admin(user):
    if user.is_staff or user.is_superuser:
        return True
    return user.groups.filter(name="Admin").exists()


@router.get("/users", response=List[UserOut])
@require_admin
def listar_users(request):
    qs = User.objects.all().prefetch_related('groups').order_by("username")
    return qs


@router.post("/users", response=UserOut)
@require_admin
def crear_user(request, payload: UserIn):
    data = payload.dict(exclude_none=True)
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    groups_list = data.get('groups', [])

    # Validación manual
    if User.objects.filter(username=username).exists():
        raise HttpError(400, "Ya existe un usuario con ese nombre.")
    if email and User.objects.filter(email=email).exists():
        raise HttpError(400, "Ya existe un usuario con ese email.")

    # Generación de contraseña si no existe
    generated_password = None
    if not password:
        from django.utils.crypto import get_random_string
        password = get_random_string(length=12)
        generated_password = password

    # Creación
    user = User.objects.create(
        username=username,
        email=email,
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', '')
    )
    user.set_password(password)
    user.save()

    # Logica de Perfil y Credenciales
    # El perfil ya se crea por signal (signals.py), así que lo obtenemos y actualizamos.
    profile = user.profile
    profile.must_change_password = True
    profile.temp_password = generated_password if generated_password else None
    profile.save()

    if groups_list:
        groups = Group.objects.filter(name__in=groups_list)
        user.groups.set(groups)

    # Email
    if generated_password and user.email:
        try:
            subject = 'Bienvenido al sistema CFP - Tus credenciales'
            
            # Texto plano (fallback)
            text_message = f"""Hola {user.first_name or user.username},
Se ha creado tu cuenta en el sistema de Gestión Académica CFP.

Tus credenciales de acceso son:
Usuario: {user.username}
Contraseña: {generated_password}

Link de acceso: {getattr(settings, 'FRONTEND_URL', 'https://cfp.lucasoviedodev.org')}/login
Por favor, ingresa y cambia tu contraseña lo antes posible.
"""

            # HTML Message
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #1e1b4b; margin: 0;">Bienvenido al Sistema CFP</h2>
                    </div>
                    <p>Hola <strong>{user.first_name or user.username}</strong>,</p>
                    <p>Tu cuenta ha sido creada exitosamente. A continuación encontrarás tus credenciales de acceso:</p>
                    
                    <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>👤 Usuario:</strong> {user.username}</p>
                        <p style="margin: 5px 0;"><strong>🔑 Contraseña:</strong> <span style="font-family: monospace; background: #eee; padding: 2px 6px; rounded: 4px;">{generated_password}</span></p>
                    </div>

                    <p style="text-align: center; margin: 30px 0;">
                        <a href="{getattr(settings, 'FRONTEND_URL', 'https://cfp.lucasoviedodev.org')}/login" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ingresar al Sistema</a>
                    </p>

                    <p style="font-size: 13px; color: #666; border-top: 1px solid #eee; padding-top: 20px;">
                        Por favor, cambia tu contraseña inmediatamente después de iniciar sesión por primera vez.<br>
                        Si no solicitaste esta cuenta, por favor ignora este correo.
                    </p>
                </div>
            </body>
            </html>
            """

            send_mail(
                subject=subject,
                message=text_message,
                from_email=None,
                recipient_list=[user.email],
                fail_silently=False,
                html_message=html_message
            )
            # Marcar como enviado
            profile.credentials_sent_at = timezone.now()
            profile.save()
            print(f"✅ Email de credenciales enviado exitosamente a {user.email}")
            
        except Exception as e:
            print(f"Error enviando email a {user.email}: {e}")

    return user


@router.put("/users/{user_id}", response=UserOut)
@router.patch("/users/{user_id}", response=UserOut)
@require_admin
def actualizar_user(request, user_id: int, payload: UserIn):
    user = get_object_or_404(User, pk=user_id)
    data = payload.dict(exclude_none=True)

    # Validaciones uniqueness (excluyendo self)
    if 'username' in data and User.objects.filter(username=data['username']).exclude(pk=user_id).exists():
        raise HttpError(400, "Ya existe un usuario con ese nombre.")
    if 'email' in data and data['email'] and User.objects.filter(email=data['email']).exclude(pk=user_id).exists():
        raise HttpError(400, "Ya existe un usuario con ese email.")

    # Update fields
    for field in ['username', 'email', 'first_name', 'last_name']:
        if field in data:
            setattr(user, field, data[field])
    
    # Password update
    if 'password' in data and data['password']:
        user.set_password(data['password'])

    user.save()

    # Groups update
    if 'groups' in data:
        groups = Group.objects.filter(name__in=data['groups'])
        user.groups.set(groups)

    return user


@router.delete("/users/{user_id}", response=dict)
@require_admin
def eliminar_user(request, user_id: int):
    user = get_object_or_404(User, pk=user_id)
    user.delete()
    return {"deleted": True, "id": user_id}


@router.post("/users/{user_id}/enviar-credenciales", response=dict)
@require_admin
def enviar_credenciales(request, user_id: int):
    """
    Envía las credenciales por email a un usuario específico.
    El usuario debe tener un UserProfile con temp_password configurado.
    """
    user = get_object_or_404(User, pk=user_id)
    
    # Verificar que el usuario tenga un perfil
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        return {
            "success": False,
            "error": "El usuario no tiene un UserProfile asociado"
        }
    
    # Verificar que tenga temp_password
    if not profile.temp_password:
        return {
            "success": False,
            "error": "El usuario no tiene contraseña temporal generada"
        }
    
    # Verificar que tenga email
    if not user.email:
        return {
            "success": False,
            "error": "El usuario no tiene email configurado"
        }
    
    # Preparar el email
    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://cfp.lucasoviedodev.org')
    
    asunto = "Credenciales de acceso - Sistema CFP"
    cuerpo = f"""Hola {user.first_name} {user.last_name},

Te damos la bienvenida al Sistema de Gestión CFP.

Tus credenciales de acceso son:

🔐 Usuario: {user.username}
🔑 Contraseña: {profile.temp_password}

🌐 Link de acceso: {frontend_url}/login

IMPORTANTE:
- Por seguridad, deberás cambiar tu contraseña en el primer inicio de sesión.
- Guarda estas credenciales en un lugar seguro.
- Si tienes problemas para acceder, contacta a soporte.

Saludos cordiales,
Centro de Formación Profesional
"""
    
    try:
        # Enviar el email
        send_mail(
            subject=asunto,
            message=cuerpo,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        # Marcar como enviado
        profile.credentials_sent_at = timezone.now()
        profile.save()
        
        return {
            "success": True,
            "message": f"Credenciales enviadas exitosamente a {user.email}",
            "user_id": user_id,
            "email": user.email,
            "sent_at": profile.credentials_sent_at.isoformat()
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Error al enviar email: {str(e)}"
        }


@router.post("/users/{user_id}/regenerate-password", response=dict)
@require_admin
def regenerar_password(request, user_id: int):
    user = get_object_or_404(User, pk=user_id)
    
    if not user.email:
        raise HttpError(400, "El usuario no tiene email configurado.")

    # 1. Regenerate Password
    from django.utils.crypto import get_random_string
    new_password = get_random_string(length=12)
    
    user.set_password(new_password)
    user.save()

    # 2. Update Profile
    # Ensure profile exists
    if not hasattr(user, 'profile'):
        UserProfile.objects.create(user=user)
    
    profile = user.profile
    profile.temp_password = new_password
    profile.must_change_password = True
    profile.save()

    # 3. Send Email
    try:
        subject = 'Credenciales actualizadas - Sistema CFP'
        
        text_message = f"""Hola {user.first_name or user.username},
Se han regenerado tus credenciales de acceso.

Nuevos datos de acceso:
Usuario: {user.username}
Contraseña: {new_password}

Link: {getattr(settings, 'FRONTEND_URL', 'https://cfp.lucasoviedodev.org')}/login
"""
        
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #1e1b4b; margin: 0;">Credenciales Actualizadas</h2>
                </div>
                <p>Hola <strong>{user.first_name or user.username}</strong>,</p>
                <p>Se han regenerado tus credenciales de acceso al Sistema CFP:</p>
                
                <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>👤 Usuario:</strong> {user.username}</p>
                    <p style="margin: 5px 0;"><strong>🔑 Nueva Contraseña:</strong> <span style="font-family: monospace; background: #eee; padding: 2px 6px; rounded: 4px;">{new_password}</span></p>
                </div>

                <p style="text-align: center; margin: 30px 0;">
                    <a href="{getattr(settings, 'FRONTEND_URL', 'https://cfp.lucasoviedodev.org')}/login" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ingresar al Sistema</a>
                </p>

                <p style="font-size: 13px; color: #666; border-top: 1px solid #eee; padding-top: 20px;">
                    Debes cambiar esta contraseña al iniciar sesión.<br>
                    Si no solicitaste este cambio, contacta a soporte inmediatamente.
                </p>
            </div>
        </body>
        </html>
        """

        send_mail(
            subject=subject,
            message=text_message,
            from_email=None,
            recipient_list=[user.email],
            fail_silently=False,
            html_message=html_message
        )
        
        profile.credentials_sent_at = timezone.now()
        profile.save()
        print(f"✅ Email de regeneración enviado a {user.email}")
        
    except Exception as e:
        print(f"Error enviando email regeración a {user.email}: {e}")

    return {
        "success": True,
        "message": f"Contraseña regenerada y enviada a {user.email}"
    }


@router.put("/user/change-password", response=dict)
def cambiar_password_propio(request, payload: ChangePasswordIn):
    user = request.user
    if not user.check_password(payload.current_password):
        raise HttpError(400, "Contraseña actual incorrecta.")
    
    user.set_password(payload.new_password)
    user.save()
    
    # Marcamos que ya cambió su contraseña
    # Usamos hasattr/get_or_create para asegurar profile
    if hasattr(user, 'profile'):
        profile = user.profile
        profile.must_change_password = False
        profile.save()
    else:
        # Si no tiene profile, lo creamos (aunque es raro si se creó via signal)
        UserProfile.objects.create(user=user, must_change_password=False)
        
    return {"success": True, "message": "Contraseña actualizada exitosamente."}


@router.get("/groups", response=List[dict])
@require_admin
def listar_grupos(request):
    qs = Group.objects.all().order_by("name")
    return GroupSerializer(qs, many=True).data
