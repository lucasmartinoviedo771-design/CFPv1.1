from core.models import Estudiante, NivelacionDigital, Modulo
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Router, Schema
from core.api.permissions import require_admin
from core.utils.rate_limit import ip_rate_limit

import uuid
from typing import Dict, Any

class SubmitSchema(Schema):
    answers: Dict[str, Any]
    wants_module1: bool = False


router = Router()

@router.post("/generate/{student_id}") # Inherits global JWT authentication
@require_admin
def generate_token(request, student_id: int):
    estudiante = get_object_or_404(Estudiante, id=student_id)
    from core.services.email_service import enviar_correo_nivelacion
    enviar_correo_nivelacion(estudiante.id)
    nivelacion = get_object_or_404(NivelacionDigital, estudiante=estudiante)
    return {"token": nivelacion.token, "student_name": f"{estudiante.nombre} {estudiante.apellido}"}

QUESTIONS = [
    {
        "id": 1,
        "text": "¿Qué es un \"enlace\" o \"hipervínculo\" en una página web?",
        "options": ["Una imagen decorativa", "Un texto o imagen que al hacer clic te lleva a otra página o sección", "Un anuncio publicitario", "El título principal de la página"],
        "correct": 1
    },
    {
        "id": 2,
        "text": "¿Qué significa \"descargar\" un archivo de internet?",
        "options": ["Subir un archivo a una página web", "Guardar una copia del archivo en tu dispositivo", "Eliminar el archivo de internet", "Compartir el archivo con otros usuarios en línea"],
        "correct": 1
    },
    {
        "id": 3,
        "text": "¿Cuál es la función principal de un explorador web (navegador)?",
        "options": ["Escribir y editar documentos de texto.", "Mostrar páginas web y permitir la navegación por internet.", "Enviar y recibir correos electrónicos.", "Reproducir música y videos."],
        "correct": 1
    },
    {
        "id": 4,
        "text": "¿Qué es una \"contraseña\" o \"clave\" en el contexto de internet?",
        "options": ["Un programa para proteger la computadora de virus", "Una secuencia secreta de caracteres para acceder a una cuenta o servicio en línea", "El nombre de usuario para iniciar sesión en una página web", "Un código de descuento para compras en línea"],
        "correct": 1
    },
    {
        "id": 5,
        "text": "¿Qué significa \"cerrar sesión\" o \"salir\" de una cuenta en línea?",
        "options": ["Eliminar la cuenta permanentemente", "Desactivar temporalmente la cuenta", "Finalizar la sesión activa y requerir volver a ingresar las credenciales para acceder", "Guardar la información de la sesión para un acceso más rápido la próxima vez"],
        "correct": 2
    },
    {
        "id": 6,
        "text": "¿Qué es el \"correo electrónico\" o \"e-mail\"?",
        "options": ["Un programa para crear presentaciones", "Un servicio para enviar y recibir mensajes a través de internet", "Una red social para compartir mensajes cortos", "Un sistema para realizar videollamadas"],
        "correct": 1
    },
    {
        "id": 7,
        "text": "¿Qué precaución básica se debe tener al navegar por internet?",
        "options": ["Compartir contraseñas con amigos cercanos", "Hacer clic en todos los enlaces que aparezcan", "Evitar ingresar información personal en sitios web no seguros (sin \"https://\")", "Descargar archivos de fuentes desconocidas sin analizarlos"],
        "correct": 2
    },
    {
        "id": 8,
        "text": "¿Cuál de los siguientes dispositivos se utiliza principalmente para almacenar información de forma permanente en una computadora?",
        "options": ["Memoria RAM", "Unidad Central de Procesamiento (CPU)", "Disco duro o unidad de estado sólido (SSD)", "Una marca de computadoras"],
        "correct": 2
    },
    {
        "id": 9,
        "text": "¿Cuál de los siguientes iconos suele representar una conexión Wi-Fi en un dispositivo electrónico?",
        "options": ["Un enchufe", "Unas ondas o barras curvas que se expanden hacia arriba", "Un círculo con una flecha", "Un candado cerrado para navegar por internet", "Una marca de computadoras"],
        "correct": 1
    },
    {
        "id": 10,
        "text": "¿Qué unidad se utiliza comúnmente para medir la capacidad de almacenamiento?",
        "options": ["Hertz (Hz)", "Watts (W)", "Gigabytes (GB) o Terabytes (TB)", "Pixeles"],
        "correct": 2
    }
]

QUESTIONS_PUBLIC = [
    {k: v for k, v in q.items() if k != "correct"}
    for q in QUESTIONS
]

@router.get("/questions", auth=None)
def get_questions(request):
    return {"questions": QUESTIONS_PUBLIC}

@router.get("/test/{token}", auth=None)
@ip_rate_limit(limit=10, period=3600)
def get_test(request, token: str):
    nivelacion = get_object_or_404(NivelacionDigital, token=token)
    if nivelacion.completado:
        return {"error": "Este test ya ha sido completado.", "completado": True}
    
    return {
        "student_name": f"{nivelacion.estudiante.nombre} {nivelacion.estudiante.apellido}",
        "questions": QUESTIONS_PUBLIC
    }


@router.post("/submit/{token}", auth=None)
@ip_rate_limit(limit=10, period=3600)
def submit_test(request, token: str, payload: SubmitSchema):
    nivelacion = get_object_or_404(NivelacionDigital, token=token)

    if nivelacion.completado:
        return {"error": "Este test ya ha sido completado."}
    
    answers = payload.answers
    wants_module1 = payload.wants_module1 # Estudiante desea Módulo 1 incluso si aprobó (porque es presencial)

    # Logic to grade (uses the server-side list with correct answers)
    score = 0
    for q in QUESTIONS:
        if str(q["id"]) in answers:
            if int(answers[str(q["id"])]) == q["correct"]:
                score += 1
    
    nivelacion.puntaje = score
    nivelacion.completado = True
    nivelacion.fecha_completado = timezone.now()
    nivelacion.respuestas_json = {
        "answers": answers,
        "wants_module1": wants_module1
    }
    
    # Automatización de Inscripción
    # Buscamos la inscripción PREINSCRIPTA del alumno para este programa
    # (Habilidades Digitales id=2)
    from core.models import Inscripcion, Modulo, Programa
    
    # Intentamos encontrar Habilidades Digitales dinámicamente por nombre, si no, usamos ID 2
    prog = Programa.objects.filter(nombre__icontains="habilidades digitales").first()
    programa_id = prog.id if prog else 2

    target_module = None
    target_module_name = "Módulo 1"
    
    try:
        # Encontramos la cohorte activa en la que está preinscripto
        insc_pre = Inscripcion.objects.filter(
            estudiante=nivelacion.estudiante,
            cohorte__programa_id=programa_id,
        ).first()
        
        if insc_pre:
            cohorte = insc_pre.cohorte
            target_module_name = "Módulo 2" if (score >= 7 and not wants_module1) else "Módulo 1"
            
            # Buscamos el módulo en la misma estructura
            # Nota: Si no existe "Módulo 2", caemos en el único que haya (Módulo 1)
            target_module = Modulo.objects.filter(
                bloque__programa_id=programa_id,
                nombre__icontains=target_module_name
            ).first() or Modulo.objects.filter(bloque__programa_id=programa_id).first()
            
            if target_module:
                # Si es avanzado (score >= 7) y va al Módulo 2, registramos la aprobación del Módulo 1
                if score >= 7 and not wants_module1 and "Módulo 2" in target_module.nombre:
                    modulo1 = Modulo.objects.filter(
                        bloque__programa_id=programa_id,
                        nombre__icontains="Módulo 1"
                    ).first()
                    
                    if modulo1:
                        # 1. Registrar Nota para Módulo 1 (Parcial)
                        from core.models import Examen, Nota
                        # Buscamos el examen parcial del módulo 1
                        examen_m1 = Examen.objects.filter(modulo=modulo1, tipo_examen=Examen.PARCIAL).first()
                        if examen_m1:
                            Nota.objects.update_or_create(
                                estudiante=nivelacion.estudiante,
                                examen=examen_m1,
                                defaults={
                                    'calificacion': score,
                                    'aprobado': True,
                                    'fecha_calificacion': timezone.now(),
                                    'es_nota_definitiva': False
                                }
                            )
                        
                        # 2. Asegurar Inscripción APROBADA en Módulo 1
                        Inscripcion.objects.update_or_create(
                            estudiante=nivelacion.estudiante,
                            cohorte=cohorte,
                            modulo=modulo1,
                            defaults={'estado': Inscripcion.APROBADO}
                        )

                # Actualizamos la inscripción existente (o la pre-inscripción) al módulo destino como CURSANDO
                insc_pre.modulo = target_module
                insc_pre.estado = "CURSANDO"
                insc_pre.save()
                nivelacion.modulo_asignado = target_module

    except Exception as e:
        print(f"Error en auto-inscripcion: {e}")

    nivelacion.save()
    
    final_module_name = target_module.nombre if target_module else target_module_name
    pass_msg = f"¡Confirmado! Te hemos inscripto exitosamente en el **{final_module_name} (Virtual)**. ¡Nos vemos en clases!" if not wants_module1 else f"¡Confirmado! Basado en tu elección, te hemos inscripto en el **{final_module_name} (Presencial)** para reforzar tus bases."
    fail_msg = f"¡Gracias por completar el diagnóstico! Para asegurar tu mejor experiencia de aprendizaje, te hemos inscripto en el **{final_module_name} (Presencial)**. Aquí aprenderás las bases fundamentales antes de avanzar al siguiente nivel."


    return {
        "score": score,
        "passed": score >= 7,
        "message": pass_msg if score >= 7 else fail_msg
    }


