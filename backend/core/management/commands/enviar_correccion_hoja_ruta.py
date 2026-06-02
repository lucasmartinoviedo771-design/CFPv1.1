from django.core.management.base import BaseCommand
from django.core.mail import EmailMessage
from django.conf import settings
from core.models import PreinscripcionTerciario
import html
import time

class Command(BaseCommand):
    help = "Envía un correo de corrección del enlace de la Hoja de Ruta a todos los preinscriptos del Terciario."

    def add_arguments(self, parser):
        parser.add_argument(
            '--send',
            action='store_true',
            help='Envía los correos de verdad. Si no se especifica, corre en modo dry-run (simulación).',
        )

    def handle(self, *args, **options):
        send = options['send']
        preinscriptos = PreinscripcionTerciario.objects.all().order_by('id')
        total = preinscriptos.count()

        self.stdout.write(f"Se encontraron {total} estudiantes preinscriptos.")
        if not send:
            self.stdout.write(self.style.WARNING("MODO SIMULACIÓN (DRY-RUN). No se enviará ningún correo. Usa --send para enviarlos."))

        enviados = 0
        for p in preinscriptos:
            apellido_safe = html.escape(p.apellido)
            nombre_safe = html.escape(p.nombre)

            subject = "[Fe de erratas] Enlace de Hoja de Ruta - Tecnicatura Superior en Ciencia de Datos e IA"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f5; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; overflow: hidden; }}
                    .header {{ background-color: #1a1f4e; color: #ffffff; padding: 20px; text-align: center; border-bottom: 4px solid #f5c518; }}
                    .header h1 {{ margin: 0; font-size: 20px; }}
                    .content {{ padding: 25px 30px; }}
                    .errata-box {{ background-color: #fffbeb; padding: 15px 20px; border-left: 4px solid #d97706; margin: 20px 0; border-radius: 0 8px 8px 0; }}
                    .btn {{ display: inline-block; padding: 10px 20px; background-color: #1a1f4e; color: #ffffff !important; text-decoration: none; font-weight: bold; border-radius: 6px; margin-top: 10px; }}
                    .contacto-box {{ background-color: #f1f5f9; padding: 20px; border-radius: 8px; font-size: 14px; margin-top: 25px; border: 1px solid #e2e8f0; }}
                    .contacto-item {{ margin-bottom: 6px; }}
                    .footer {{ background-color: #0f172a; color: #cbd5e1; text-align: center; padding: 15px; font-size: 11px; }}
                    a {{ color: #0284c7; text-decoration: none; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Centro Politécnico Superior</h1>
                    </div>
                    <div class="content">
                        <p style="font-size: 16px; margin-top: 0;">Estimado/a <strong>{apellido_safe}, {nombre_safe}</strong>,</p>
                        <p>Te escribimos para informarte una fe de erratas en el correo de bienvenida enviado anteriormente:</p>
                        
                        <div class="errata-box">
                            <p style="margin: 0; font-weight: bold; color: #b45309;">⚠️ Fe de Erratas: Enlace duplicado</p>
                            <p style="margin-top: 8px; margin-bottom: 12px;">El enlace a la <strong>Hoja de Ruta</strong> estaba duplicado y abría la presentación general. A continuación te compartimos el enlace correcto para acceder a la Hoja de Ruta, en la cual se explica:</p>
                            <ul style="margin-top: 5px; margin-bottom: 15px; color: #b45309; padding-left: 20px;">
                                <li>✅ Registro en el campus</li>
                                <li>✅ Fechas importantes</li>
                                <li>✅ Equivalencias</li>
                                <li>✅ Entrega de documentación</li>
                            </ul>
                            <p style="text-align: center; margin: 0;">
                                <a href="https://view.genially.com/69fe7b75e3792921111bbaac" target="_blank" class="btn">👉 Abrir Hoja de Ruta Correcta</a>
                            </p>
                        </div>

                        <div class="contacto-box">
                            <p style="margin-top: 0; font-weight: bold; color: #1a1f4e;">Ante cualquier duda o consulta, recuerda que estamos a tu disposición:</p>
                            <div class="contacto-item">📍 <strong>Río Grande:</strong> <a href="mailto:Tutoria.cetns.rg@gmail.com">Tutoria.cetns.rg@gmail.com</a></div>
                            <div class="contacto-item">📍 <strong>Ushuaia:</strong> <a href="mailto:Tutoria.cetns.ush@tdf.edu.ar">Tutoria.cetns.ush@tdf.edu.ar</a></div>
                            <div class="contacto-item">📍 <strong>Tolhuin:</strong> <a href="mailto:Tutoria.cetns.tol@tdf.edu.ar">Tutoria.cetns.tol@tdf.edu.ar</a></div>
                        </div>
                    </div>
                    <div class="footer">
                        Mensaje automático del Centro Politécnico Superior. Por favor, no respondas a este correo.
                    </div>
                </div>
            </body>
            </html>
            """

            if send:
                try:
                    email = EmailMessage(
                        subject=subject,
                        body=html_content,
                        from_email=settings.TERCIARIO_FROM_EMAIL,
                        to=[p.email],
                    )
                    email.content_subtype = "html"
                    email.send(fail_silently=False)
                    self.stdout.write(self.style.SUCCESS(f"[{enviados + 1}/{total}] Correo enviado a: {p.email} ({p.apellido}, {p.nombre})"))
                    time.sleep(0.5) # Evitar saturación del servidor SMTP
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error al enviar a {p.email}: {e}"))
            else:
                self.stdout.write(f"[Simulado] Se enviaría correo a: {p.email} ({p.apellido}, {p.nombre})")

            enviados += 1

        self.stdout.write(self.style.SUCCESS(f"Proceso finalizado. Total procesados: {enviados}"))
