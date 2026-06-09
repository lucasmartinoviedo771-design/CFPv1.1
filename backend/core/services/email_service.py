import os.path
import base64
import logging
from email.mime.text import MIMEText
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from core.models import Estudiante, Inscripcion

logger = logging.getLogger(__name__)

# Si se modifican estos alcances, elimine el archivo token.json.
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

CREDENTIALS_PATH = os.path.join(settings.BASE_DIR, 'core', 'resources', 'gmail_credentials.json')
# Usamos el volumen persistente de media para que el token no se borre en deploys
TOKEN_PATH = os.path.join(settings.BASE_DIR, 'media', 'tokens', 'gmail_token.json')

def get_gmail_service():
    os.makedirs(os.path.dirname(TOKEN_PATH), exist_ok=True)
    creds = None
    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    
    # Si no hay credenciales válidas disponibles, deje que el usuario inicie sesión.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # En un entorno de producción/servidor, esto fallará si no hay token.json
            logger.error("No se encontró token.json válido para Gmail API. Se requiere autorización inicial.")
            return None
        # Guardar las credenciales para la próxima ejecución
        with open(TOKEN_PATH, 'w') as token:
            token.write(creds.to_json())

    return build('gmail', 'v1', credentials=creds)

def enviar_correo_bienvenida(estudiante_id: int):
    """
    Envía el correo de bienvenida usando la API de Gmail (OAuth2).
    """
    try:
        service = get_gmail_service()
        if not service:
            logger.error("No se pudo obtener el servicio de Gmail. Abortando envío.")
            return False

        estudiante = Estudiante.objects.get(id=estudiante_id)
        inscripciones = Inscripcion.objects.filter(
            estudiante=estudiante, 
            estado__in=[Inscripcion.CURSANDO, Inscripcion.PREINSCRIPTO]
        ).select_related('cohorte__programa', 'modulo__bloque', 'cohorte__bloque')

        if not inscripciones.exists():
            return False

        programas_ids = set()
        bloques_nombres = set()
        for ins in inscripciones:
            programas_ids.add(ins.cohorte.programa.id)
            bloque = ins.cohorte.bloque or (ins.modulo.bloque if ins.modulo else None)
            if bloque:
                bloques_nombres.add(bloque.nombre)

        contenido_opciones = []
        
        # Trayecto: Habilidades Digitales (ID 2)
        if 2 in programas_ids:
            contenido_opciones.append({
                'titulo': 'Habilidades Digitales',
                'clave': 'Hab-CFhg2025',
                'link': 'https://politecnico.ar/campus/course/index.php?categoryid=12'
            })

        # Trayecto: Diseño y Fabricación Digital / Impresión 3D (ID 4)
        if 4 in programas_ids:
            contenido_opciones.append({
                'titulo': 'Diseño y Fabricación Digital (Impresión 3D)',
                'clave': '3D-Dpi#$*203g',
                'link': 'https://politecnico.ar/campus/course/index.php?categoryid=12'
            })

        # Trayecto: Programador de Nivel III / CODE 3 (ID 1)
        if 1 in programas_ids:
            contenido_opciones.append({
                'titulo': 'CODE 3 (Trayecto de Programación)',
                'especificos': [
                    {'nombre': 'Programación I', 'clave': 'Prog12025CFP'},
                    {'nombre': 'Base de Datos', 'clave': 'BaseDatos2025CFP'},
                    {'nombre': 'Relaciones Laborales', 'clave': 'ReLab2025CFP'}
                ],
                'link': 'https://politecnico.ar/campus/course/index.php?categoryid=14',
                'nota_programacion_ii': True
            })

        # Trayecto: Sistemas de Representación (ID 3)
        if 3 in programas_ids:
             contenido_opciones.append({
                'titulo': 'Sistemas de Representación',
                'clave': 'Sist-Rep2025',
                'link': 'https://politecnico.ar/campus/course/index.php?categoryid=12'
            })

        # Trayecto: Matemática para Técnicos (ID 6)
        if 6 in programas_ids:
            contenido_opciones.append({
                'titulo': 'Matemática para Técnicos',
                'clave': 'MaTec#$2026',
                'link': 'https://politecnico.ar/campus/course/index.php?categoryid=12'
            })

        # Definimos el link principal según el programa prioritario (prioridad a Programador)
        main_url = 'https://politecnico.ar/campus/course/index.php?categoryid=14' if 1 in programas_ids else 'https://politecnico.ar/campus/course/index.php?categoryid=12'

        context = {
            'nombre': estudiante.nombre,
            'opciones': contenido_opciones,
            'campus_url': main_url,
            'tutorial_url': 'https://drive.google.com/file/d/1yeBuJ3bHig6-pLYmiqZ0UW1mx9r81Mpe/view'
        }

        html_content = render_to_string('emails/bienvenida_campus.html', context)
        
        from django.core.mail import EmailMessage
        from django.core.mail.backends.smtp import EmailBackend
        
        connection = EmailBackend(
            host=settings.CFP_EMAIL_HOST,
            port=settings.CFP_EMAIL_PORT,
            username=settings.CFP_EMAIL_HOST_USER,
            password=settings.CFP_EMAIL_HOST_PASSWORD,
            use_tls=settings.CFP_EMAIL_USE_TLS,
            use_ssl=settings.CFP_EMAIL_USE_SSL,
        )

        email = EmailMessage(
            subject='¡Bienvenido/a! Ya puedes comenzar tu cursada virtual en el CFP',
            body=html_content,
            from_email=settings.CFP_FROM_EMAIL,
            to=[estudiante.email],
            connection=connection,
        )
        email.content_subtype = "html"
        
        email.send(fail_silently=False)
        logger.info(f"Correo de bienvenida enviado a {estudiante.email} usando SMTP")
        return True

    except Exception as e:
        logger.error(f"Error Gmail API: {str(e)}")
        return False

def enviar_correo_nivelacion(estudiante_id: int):
    """
    Genera/actualiza el token de nivelación digital y envía el correo correspondiente al estudiante.
    """
    try:
        from core.models import NivelacionDigital
        import uuid
        
        estudiante = Estudiante.objects.get(id=estudiante_id)
        
        # Generar o actualizar token
        token = str(uuid.uuid4())
        nivelacion, created = NivelacionDigital.objects.update_or_create(
            estudiante=estudiante,
            defaults={'token': token, 'completado': False}
        )
        
        service = get_gmail_service()
        if not service:
            logger.error("No se pudo obtener el servicio de Gmail. Abortando envío de nivelación.")
            return False

        link = f"https://politecnico.ar/cfp/nivelacion.html?token={token}"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f5; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; overflow: hidden; }}
                .header {{ background-color: #0b1c3c; color: #ffffff; padding: 25px 20px; text-align: center; border-bottom: 5px solid #f26b21; }}
                .header h1 {{ margin: 0; font-size: 24px; letter-spacing: 0.5px; }}
                .header h2 {{ margin: 5px 0 0 0; font-size: 16px; font-weight: normal; color: #cbd5e1; }}
                .content {{ padding: 30px 25px; }}
                .btn-box {{ text-align: center; margin: 30px 0; }}
                .btn {{ background-color: #f26b21; color: #ffffff !important; padding: 12px 30px; font-weight: bold; border-radius: 6px; text-decoration: none; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(242, 107, 33, 0.2); }}
                .btn:hover {{ background-color: #d95a16; }}
                .contacto-box {{ background-color: #f1f5f9; padding: 25px; border-radius: 8px; font-size: 15px; margin-top: 20px; border: 1px solid #e2e8f0; }}
                .contacto-item {{ margin-bottom: 12px; line-height: 1.5; }}
                .contacto-item:last-child {{ margin-bottom: 0; }}
                .footer {{ background-color: #0f172a; color: #94a3b8; text-align: center; padding: 20px; font-size: 12px; }}
                a {{ color: #0284c7; text-decoration: none; font-weight: 600; }}
                a:hover {{ text-decoration: underline; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Centro Politécnico Superior</h1>
                    <h2>Formación Profesional - Malvinas Argentinas</h2>
                </div>
                <div class="content">
                    <p style="font-size: 17px; margin-top: 0;">Hola <strong>{estudiante.nombre}</strong>,</p>
                    <p>Para determinar cuál es el módulo de <strong>Habilidades Digitales</strong> más adecuado para vos, necesitamos que realices un breve autodiagnóstico de nivelación digital.</p>
                    <p>Este diagnóstico consta de 10 preguntas sencillas sobre conceptos generales de informática y navegación web. No te preocupes, no es un examen eliminatorio, sino una herramienta para ubicarte en el nivel que mejor te acompañe en tu aprendizaje.</p>
                    
                    <div class="btn-box">
                        <a href="{link}" class="btn" target="_blank">Comenzar Autodiagnóstico</a>
                    </div>

                    <p style="font-size: 14px; color: #666;">Si el botón no funciona, podés copiar y pegar el siguiente enlace en tu navegador:<br><a href="{link}">{link}</a></p>

                    <p style="font-size: 16px; margin-top: 35px;"><strong>Ante cualquier duda o consulta, recordá que podés comunicarte con nosotros:</strong></p>
                    
                    <div class="contacto-box">
                        <div class="contacto-item">📍 <strong>Dirección:</strong> Monte Independencia 261, Barrio El Mirador (Margen Sur), Río Grande, Tierra del Fuego.</div>
                        <div class="contacto-item">📱 <strong>WhatsApp:</strong> <a href="https://wa.me/5492964355801">+54 9 2964 35-5801</a></div>
                        <div class="contacto-item">📞 <strong>Teléfono:</strong> 02964 69-7979</div>
                        <div class="contacto-item">✉️ <strong>Email:</strong> <a href="mailto:estudiantes.cfp@malvinastdf.edu.ar">estudiantes.cfp@malvinastdf.edu.ar</a></div>
                        <div class="contacto-item">🌐 <strong>Web:</strong> <a href="https://politecnico.ar">politecnico.ar</a></div>
                    </div>
                    
                    <p style="margin-top: 35px; text-align: center; font-size: 18px; color: #f26b21;"><strong>¡Te deseamos muchos éxitos!</strong></p>
                </div>
                <div class="footer">
                    Este es un mensaje automático del sistema de gestión del CFP.<br>Por favor, no respondas a este correo.
                </div>
            </div>
        </body>
        </html>
        """

        from django.core.mail import EmailMessage
        from django.core.mail.backends.smtp import EmailBackend
        
        connection = EmailBackend(
            host=settings.CFP_EMAIL_HOST,
            port=settings.CFP_EMAIL_PORT,
            username=settings.CFP_EMAIL_HOST_USER,
            password=settings.CFP_EMAIL_HOST_PASSWORD,
            use_tls=settings.CFP_EMAIL_USE_TLS,
            use_ssl=settings.CFP_EMAIL_USE_SSL,
        )

        email = EmailMessage(
            subject='Autodiagnóstico de Nivelación - Habilidades Digitales - CFP',
            body=html_content,
            from_email=settings.CFP_FROM_EMAIL,
            to=[estudiante.email],
            connection=connection,
        )
        email.content_subtype = "html"

        email.send(fail_silently=False)
        logger.info(f"Correo de nivelación enviado a {estudiante.email} usando SMTP")
        return True
    except Exception as e:
        logger.error(f"Error enviando correo de nivelación: {str(e)}")
        return False


def enviar_correo_bienvenida_terciario(preinscripcion) -> bool:
    """
    Envía el correo de bienvenida del Terciario (Habilidades Digitales en Moodle).
    """
    try:
        from django.core.mail import EmailMessage
        from django.template.loader import render_to_string
        from django.utils import timezone
        
        nombre_completo = f"{preinscripcion.nombre} {preinscripcion.apellido}".strip()
        html_content = render_to_string('emails/bienvenida_terciario_moodle.html', {
            'nombre': nombre_completo
        })
        
        email = EmailMessage(
            subject='Acceso al Campus Virtual - Habilidades Digitales',
            body=html_content,
            from_email=settings.TERCIARIO_FROM_EMAIL,
            to=[preinscripcion.email],
        )
        email.content_subtype = "html"
        email.send(fail_silently=False)
        
        # Registrar fecha de envío
        preinscripcion.correo_bienvenida_at = timezone.now()
        preinscripcion.save(update_fields=['correo_bienvenida_at'])
        
        logger.info(f"Correo de bienvenida Terciario enviado exitosamente a {preinscripcion.email}")
        return True
    except Exception as e:
        logger.error(f"Error enviando correo de bienvenida Terciario a {preinscripcion.email}: {str(e)}")
        return False
