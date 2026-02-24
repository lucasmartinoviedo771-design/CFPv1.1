
import os
import django
import sys

sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'academia.settings')
django.setup()

from core.models import Cohorte, Inscripcion, Bloque, Modulo

try:
    c = Cohorte.objects.get(id=56)
    print(f"Cohorte: {c.nombre} (ID: {c.id})")
    
    inscripciones = Inscripcion.objects.filter(cohorte=c)
    print(f"Inscripciones count: {inscripciones.count()}")
    
    if inscripciones.exists():
        i = inscripciones.first()
        print(f"First inscription: Estudiante {i.estudiante.id}, Modulo {i.modulo_id}")

    b = Bloque.objects.get(id=5)
    print(f"Bloque: {b.nombre} (ID: {b.id})")
    
    modulos = Modulo.objects.filter(bloque=b)
    print(f"Modulos count: {modulos.count()}")
    for m in modulos:
        print(f" - Modulo: {m.nombre} (ID: {m.id})")

except Exception as e:
    print(f"Error: {e}")
