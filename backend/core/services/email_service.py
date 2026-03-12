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

        # Trayecto: Sistemas de Representación (ID 3) - Opcional si no tenía clave específica
        if 3 in programas_ids:
             contenido_opciones.append({
                'titulo': 'Sistemas de Representación',
                'clave': 'Sist-Rep2025', # Clave genérica o placeholder
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
        
        # Crear el mensaje
        message = MIMEText(html_content, 'html')
        message['to'] = estudiante.email
        message['from'] = settings.DEFAULT_FROM_EMAIL
        message['subject'] = '¡Bienvenido/a! Ya puedes comenzar tu cursada virtual en el CFP'
        
        # Codificar en base64
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        # Enviar
        service.users().messages().send(userId='me', body={'raw': raw}).execute()
        logger.info(f"Correo OAuth2 enviado a {estudiante.email}")
        return True

    except Exception as e:
        logger.error(f"Error Gmail API: {str(e)}")
        return False
