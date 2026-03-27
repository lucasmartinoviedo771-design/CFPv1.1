import base64
import logging
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.message import EmailMessage, EmailMultiAlternatives
from .services.email_service import get_gmail_service

logger = logging.getLogger(__name__)

class GmailOAuth2Backend(BaseEmailBackend):
    """
    Backend de correo para Django que utiliza la API de Gmail (OAuth2).
    Aprovecha la infraestructura existente en core/services/email_service.py.
    """

    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        
        service = get_gmail_service()
        if not service:
            logger.error("GmailOAuth2Backend: No se pudo obtener el servicio de Gmail (token.json podría faltar o no ser válido).")
            if not self.fail_silently:
                raise Exception("No se pudo obtener el servicio de Gmail API.")
            return 0
        
        sent_count = 0
        for message in email_messages:
            try:
                self._send_gmail_message(service, message)
                sent_count += 1
            except Exception as e:
                logger.error(f"GmailOAuth2Backend: Error enviando correo a {message.to}: {e}")
                if not self.fail_silently:
                    raise
        return sent_count

    def _send_gmail_message(self, service, django_message):
        """
        Convierte un objeto EmailMessage de Django en un mensaje para la API de Gmail.
        """
        # Crear mensaje MIME
        if django_message.attachments:
            mime_msg = MIMEMultipart()
        elif isinstance(django_message, EmailMultiAlternatives):
            mime_msg = MIMEMultipart('alternative')
        else:
            mime_msg = MIMEText(django_message.body, _subtype=django_message.content_subtype or 'plain', _charset='utf-8')

        mime_msg['subject'] = django_message.subject
        mime_msg['to'] = ", ".join(django_message.to)
        mime_msg['from'] = django_message.from_email or settings.DEFAULT_FROM_EMAIL
        
        if django_message.cc:
            mime_msg['cc'] = ", ".join(django_message.cc)
        if django_message.bcc:
            # BCC no se incluye en los headers MIME (normalmente) pero Gmail API los maneja
            # Si los ponemos aquí, Gmail los enviará pero no los mostrará en el header (BCC property)
            # Nota: La API de Gmail maneja el BCC si se incluye en el raw pero es mejor usar el header 'bcc'
            mime_msg['bcc'] = ", ".join(django_message.bcc)

        # Cuerpo del mensaje si es Multipart
        if django_message.attachments or isinstance(django_message, EmailMultiAlternatives):
            # Parte del cuerpo principal
            main_subtype = django_message.content_subtype or 'plain'
            body_part = MIMEText(django_message.body, main_subtype, 'utf-8')
            mime_msg.attach(body_part)

            # Parte HTML alternativa si existe (EmailMultiAlternatives)
            if isinstance(django_message, EmailMultiAlternatives):
                for content, mimetype in django_message.alternatives:
                    if mimetype == 'text/html':
                        html_part = MIMEText(content, 'html', 'utf-8')
                        mime_msg.attach(html_part)

        # Adjuntos
        for attachment in django_message.attachments:
            # Django attachment puede ser (filename, content, mimetype) o un Tuple de 2
            if isinstance(attachment, tuple):
                filename, content, mimetype = attachment[0:3]
            else:
                # Si es un objeto de archivo (Pillow, etc), Django suele manejarlo
                # pero para Gmail API necesitamos extraer el contenido
                continue # O implementar lógica para extraer

            part = MIMEBase(*mimetype.split('/'))
            part.set_payload(content)
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename="{filename}"')
            mime_msg.attach(part)

        # Codificar y enviar
        raw = base64.urlsafe_b64encode(mime_msg.as_bytes()).decode()
        service.users().messages().send(userId='me', body={'raw': raw}).execute()
