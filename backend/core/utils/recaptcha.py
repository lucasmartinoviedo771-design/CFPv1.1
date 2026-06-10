import urllib.request
import urllib.parse
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def verify_recaptcha(token: str, action: str = "preinscripcion") -> bool:
    """
    Verifica un token de reCAPTCHA v3 contra la API de Google.
    Retorna True si es válido (o si reCAPTCHA está deshabilitado/en desarrollo).
    """
    secret_key = getattr(settings, 'RECAPTCHA_SECRET_KEY', None)
    if not secret_key:
        if settings.DEBUG:
            logger.warning("RECAPTCHA_SECRET_KEY no está configurado en settings. Omitiendo validación en DEBUG.")
            return True
        else:
            logger.error("RECAPTCHA_SECRET_KEY no está configurado en settings. Denegando acceso en producción.")
            return False
        
    if settings.DEBUG and not token:
        logger.info("Modo DEBUG activo y token de reCAPTCHA ausente. Omitiendo validación.")
        return True

    if not token:
        logger.error("Token de reCAPTCHA vacío y validación requerida.")
        return False

    try:
        url = "https://www.google.com/recaptcha/api/siteverify"
        data = urllib.parse.urlencode({
            'secret': secret_key,
            'response': token
        }).encode('utf-8')
        
        req = urllib.request.Request(url, data=data, method="POST")
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode('utf-8'))
            
        error_codes = result.get('error-codes', [])
        score = result.get('score', 0.0)
        
        if not result.get('success'):
            logger.error(f"Validación de reCAPTCHA falló. Error codes: {error_codes}. Score: {score}")
            return False
            
        # Registrar score de reCAPTCHA v3 para monitoreo
        logger.info(f"reCAPTCHA validación exitosa. Score: {score} para la acción: {action}")
        
        # Validar el score de reCAPTCHA v3 (umbral recomendado es 0.5)
        if score < 0.5:
            logger.error(f"Score de reCAPTCHA bajo ({score}) para la acción {action}. Error codes: {error_codes}")
            return False
            
        return True
    except Exception as e:
        logger.error(f"Error al conectar con la API de reCAPTCHA: {e}")
        if settings.DEBUG:
            logger.info("Error de reCAPTCHA ignorado por estar en modo DEBUG (fail open).")
            return True
        else:
            logger.error("Fallo de conexión de reCAPTCHA en producción. Fallando cerrado (fail closed).")
            return False
