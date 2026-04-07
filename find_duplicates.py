import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'academia.settings')
django.setup()

from core.models import Inscripcion, Estudiante, Modulo
from django.db.models import Count

# Define "vigente" states
VIGENTE_STATES = ['PREINSCRIPTO', 'CURSANDO', 'PAUSADO', 'APROBADO', 'EGRESADO']

# Find duplicates for (estudiante, modulo) where modulo is not null
dupes_with_modulo = Inscripcion.objects.filter(
    modulo__isnull=False,
    estado__in=VIGENTE_STATES
).values('estudiante', 'modulo').annotate(
    count=Count('id')
).filter(count__gt=1)

print(f"Encontrados {dupes_with_modulo.count()} casos de duplicados con modulo.")

# Find duplicates for (estudiante, cohorte, cohorte__programa) where modulo is null
dupes_without_modulo = Inscripcion.objects.filter(
    modulo__isnull=True,
    estado__in=VIGENTE_STATES
).values('estudiante', 'cohorte__programa').annotate(
    count=Count('id')
).filter(count__gt=1)

print(f"Encontrados {dupes_without_modulo.count()} casos de duplicados sin modulo.")

total_to_delete = 0
for d in dupes_with_modulo:
    ids = list(Inscripcion.objects.filter(
        estudiante_id=d['estudiante'], 
        modulo_id=d['modulo'],
        estado__in=VIGENTE_STATES
    ).order_by('-created_at').values_list('id', flat=True))
    # We keep the first one (most recent) and mark the rest for deletion
    to_delete = ids[1:]
    total_to_delete += len(to_delete)
    print(f"Estudiante {d['estudiante']} Modulo {d['modulo']}: {len(ids)} inscripciones. Manteniendo {ids[0]}, eliminando {to_delete}")

print(f"Total de registros redundantes a eliminar: {total_to_delete}")
