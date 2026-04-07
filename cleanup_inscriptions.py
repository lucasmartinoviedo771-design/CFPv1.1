import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'academia.settings')
django.setup()

from core.models import Inscripcion, Estudiante, Modulo
from django.db.models import Count, Q

# Define states we consider "redundant if they coexist"
VIGENTE_STATES = ['PREINSCRIPTO', 'CURSANDO', 'PAUSADO', 'APROBADO', 'EGRESADO']

STATE_PRIORITY = {
    'APROBADO': 5,
    'EGRESADO': 4,
    'CURSANDO': 3,
    'PREINSCRIPTO': 2,
    'PAUSADO': 1
}

# 1. Duplicates WITH modulo
dupe_mod = Inscripcion.objects.filter(
    modulo__isnull=False,
    estado__in=VIGENTE_STATES
).values('estudiante', 'modulo').annotate(
    cnt=Count('id')
).filter(cnt__gt=1)

print(f"Limpiando duplicados con modulo...")
total_deleted = 0
for d in dupe_mod:
    est_id = d['estudiante']
    mod_id = d['modulo']
    
    qs = list(Inscripcion.objects.filter(
        estudiante_id=est_id,
        modulo_id=mod_id,
        estado__in=VIGENTE_STATES
    ))
    
    # Sort: Higher priority state first, then newer created_at
    qs.sort(key=lambda i: (STATE_PRIORITY.get(i.estado, 0), i.created_at or 0), reverse=True)
    
    to_keep = qs[0]
    to_delete = qs[1:]
    
    for i in to_delete:
        i.delete()
        total_deleted += 1
    print(f"Estudiante {est_id} - Modulo {mod_id}: Mantenida ID {to_keep.id}, eliminadas {len(to_delete)}")

# 2. Duplicates WITHOUT modulo (by program)
dupe_prog = Inscripcion.objects.filter(
    modulo__isnull=True,
    estado__in=VIGENTE_STATES
).values('estudiante', 'cohorte__programa').annotate(
    cnt=Count('id')
).filter(cnt__gt=1)

print(f"Limpiando duplicados sin modulo...")
for d in dupe_prog:
    est_id = d['estudiante']
    prog_id = d['cohorte__programa']
    
    qs = list(Inscripcion.objects.filter(
        estudiante_id=est_id,
        modulo__isnull=True,
        cohorte__programa_id=prog_id,
        estado__in=VIGENTE_STATES
    ))
    
    qs.sort(key=lambda i: (STATE_PRIORITY.get(i.estado, 0), i.created_at or 0), reverse=True)
    
    to_keep = qs[0]
    to_delete = qs[1:]
    
    for i in to_delete:
        i.delete()
        total_deleted += 1
    print(f"Estudiante {est_id} - Programa {prog_id}: Mantenida ID {to_keep.id}, eliminadas {len(to_delete)}")

print(f"Total limpieza: {total_deleted} registros eliminados.")
