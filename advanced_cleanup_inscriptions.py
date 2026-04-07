import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'academia.settings')
django.setup()

from core.models import Inscripcion, Estudiante, Nota, Modulo
from django.db.models import Avg, Max
from django.db import transaction

def advanced_cleanup():
    print("Iniciando Limpieza Avanzada de Inscripciones...")
    
    with transaction.atomic():
        # 1. EVALUAR NOTAS Y ACTUALIZAR ESTADOS
        # Para cada estudiante que tenga notas, actualizamos sus inscripciones relacionadas
        # Nota: La nota se vincula al Modulo/Bloque a través del Examen
        
        all_estudiantes = Estudiante.objects.all()
        total_updated = 0
        
        for est in all_estudiantes:
            # Obtenemos todas sus inscripciones activas (preinscriptos, cursando, pausados)
            inscripciones = list(est.inscripciones.all())
            if not inscripciones:
                continue
                
            for insc in inscripciones:
                # Buscamos notas para el módulo de esta inscripción
                if not insc.modulo_id:
                    continue
                
                # Buscamos la nota más alta para este estudiante en este módulo
                max_nota = Nota.objects.filter(
                    estudiante=est,
                    examen__modulo_id=insc.modulo_id
                ).aggregate(max_val=Max('calificacion'))['max_val']
                
                if max_nota is not None:
                    # Si tiene nota >= 6 -> APROBADO
                    if max_nota >= 6:
                        if insc.estado != 'APROBADO':
                            insc.estado = 'APROBADO'
                            insc.save()
                            total_updated += 1
                            print(f"Estudiante {est.dni} - Modulo {insc.modulo_id}: Marcado como APROBADO (Nota: {max_nota})")
                    # Si tiene nota < 6 y estaba cursando/preinscripto -> DESAPROBADO
                    elif max_nota < 6 and insc.estado in ['CURSANDO', 'PREINSCRIPTO']:
                        if insc.estado != 'DESAPROBADO':
                            insc.estado = 'DESAPROBADO'
                            insc.save()
                            total_updated += 1
                            print(f"Estudiante {est.dni} - Modulo {insc.modulo_id}: Marcado como DESAPROBADO (Nota: {max_nota})")

        # 2. COLAPSAR DUPLICADOS ACTIVOS POR BLOQUE/MODULO
        # Si un alumno tiene dos inscripciones en el mismo bloque y una ya está APROBADA,
        # la otra (que esté CURSANDO) debe cerrarse o eliminarse si es redundante.
        
        total_duplicates_cleaned = 0
        for est in all_estudiantes:
            # Agrupamos inscripciones por modulo
            mod_map = {}
            for insc in list(est.inscripciones.all()):
                if insc.modulo_id not in mod_map:
                    mod_map[insc.modulo_id] = []
                mod_map[insc.modulo_id].append(insc)
            
            for mod_id, ins_list in mod_map.items():
                if len(ins_list) > 1:
                    # Ordenar por relevancia: APROBADO > CURSANDO > PREINSCRIPTO > INACTIVO
                    status_prio = {'APROBADO': 5, 'CURSANDO': 4, 'PREINSCRIPTO': 3, 'PAUSADO': 2, 'DESAPROBADO': 1}
                    ins_list.sort(key=lambda i: (status_prio.get(i.estado, 0), i.created_at), reverse=True)
                    
                    to_keep = ins_list[0]
                    to_clean = ins_list[1:]
                    
                    for redundant in to_clean:
                        # Si la que mantenemos es APROBADA y la redundante es CURSANDO/PREINSCRIPTO, la borramos/cerramos
                        if to_keep.estado == 'APROBADO' and redundant.estado in ['CURSANDO', 'PREINSCRIPTO']:
                            redundant.delete()
                            total_duplicates_cleaned += 1
                        # Si ambas son CURSANDO, nos quedamos con la más nueva
                        elif to_keep.estado == 'CURSANDO' and redundant.estado == 'CURSANDO':
                            redundant.delete()
                            total_duplicates_cleaned += 1

    print(f"PROCESO TERMINADO.")
    print(f"Estados actualizados (Notas): {total_updated}")
    print(f"Duplicados eliminados/unificados: {total_duplicates_cleaned}")

if __name__ == "__main__":
    advanced_cleanup()
