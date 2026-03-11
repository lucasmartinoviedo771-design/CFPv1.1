import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from core.models import Estudiante, Inscripcion

logger = logging.getLogger(__name__)

def enviar_correo_bienvenida(estudiante_id: int):
    """
    Envía el correo de bienvenida y acceso al campus basado en los trayectos 
    donde el estudiante fue aceptado.
    """
    try:
        estudiante = Estudiante.objects.get(id=estudiante_id)
        inscripciones = Inscripcion.objects.filter(
            estudiante=estudiante, 
            estado__in=[Inscripcion.CURSANDO, Inscripcion.PREINSCRIPTO] # Generalmente se envía cuando pasan a Cursando
        ).select_related('cohorte__programa', 'modulo__bloque', 'cohorte__bloque')

        if not inscripciones.exists():
            logger.warning(f"No se encontraron inscripciones para el estudiante {estudiante_id} al intentar enviar correo.")
            return

        programas_ids = set()
        bloques_nombres = set()
        
        for ins in inscripciones:
            prog = ins.cohorte.programa
            programas_ids.add(prog.id)
            # Si tiene bloque directo en la cohorte o vía el módulo
            bloque = ins.cohorte.bloque or (ins.modulo.bloque if ins.modulo else None)
            if bloque:
                bloques_nombres.add(bloque.nombre)

        # Mapeo de contenidos específicos
        contenido_opciones = []
        
        # Opción A: Habilidades Digitales (ID 2)
        if 2 in programas_ids:
            contenido_opciones.append({
                'titulo': 'Habilidades Digitales',
                'clave': 'Hab-CFhg2025',
                'link': 'https://politecnico.ar/campus/login/index.php' # Reemplazar si hay uno específico
            })

        # Opción B: Impresión 3D (ID 4)
        if 4 in programas_ids:
            contenido_opciones.append({
                'titulo': 'Impresión 3D',
                'clave': '3D-Dpi#$*203g',
                'link': 'https://politecnico.ar/campus/login/index.php'
            })

        # Opción C: CODE 3 (ID 1)
        if 1 in programas_ids:
            especificos = []
            if 'Programación I' in bloques_nombres:
                especificos.append({'nombre': 'Programación I', 'clave': 'Prog12025CFP'})
            if 'Base de Datos' in bloques_nombres:
                especificos.append({'nombre': 'Base de Datos', 'clave': 'BaseDatos2025CFP'})
            if 'Relaciones Laborales' in bloques_nombres:
                especificos.append({'nombre': 'Relaciones Laborales', 'clave': 'ReLab2025CFP'})
            
            # Si no detectamos bloques específicos pero está en el programa, mostramos todos por las dudas
            if not especificos:
                especificos = [
                    {'nombre': 'Programación I', 'clave': 'Prog12025CFP'},
                    {'nombre': 'Base de Datos', 'clave': 'BaseDatos2025CFP'},
                    {'nombre': 'Relaciones Laborales', 'clave': 'ReLab2025CFP'}
                ]

            contenido_opciones.append({
                'titulo': 'CODE 3 (Trayecto de Programación)',
                'especificos': especificos,
                'link': 'https://politecnico.ar/campus/login/index.php',
                'nota_programacion_ii': True
            })

        context = {
            'nombre': estudiante.nombre,
            'opciones': contenido_opciones,
            'campus_url': 'https://politecnico.ar/campus/login/index.php',
            'tutorial_url': 'https://drive.google.com/file/d/1yeBuJ3bHig6-pLYmiqZ0UW1mx9r81Mpe/view'
        }

        html_content = render_to_string('emails/bienvenida_campus.html', context)
        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(
            subject='¡Bienvenido/a! Ya puedes comenzar tu cursada virtual en el CFP',
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[estudiante.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logger.info(f"Correo de bienvenida enviado a {estudiante.email}")
        return True

    except Exception as e:
        logger.error(f"Error al enviar correo de bienvenida al estudiante {estudiante_id}: {str(e)}")
        return False
