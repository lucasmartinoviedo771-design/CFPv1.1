# backend/core/services/evaluacion_service.py
"""
Servicio para manejar la lógica de habilitación y secuencia de evaluaciones.

Implementa las reglas de negocio para:
- Validación de habilitación para rendir exámenes
- Control de secuencia Virtual → Sincrónico
- Reinicio de ciclo si desaprueba Sincrónico
- Identificación de notas definitivas
"""

from django.core.exceptions import ValidationError
from django.db import transaction
from core.models import Nota, Examen, Estudiante, Bloque


class EvaluacionService:
    """
    Servicio centralizado para gestión de evaluaciones y habilitaciones.
    """
    
    @staticmethod
    def puede_rendir_final_virtual(estudiante, bloque):
        """
        Verifica si un estudiante puede rendir el Final Virtual de un bloque.
        
        Reglas:
        - Para bloques con múltiples módulos: Debe tener aprobados TODOS los parciales
        - Para bloques con un solo módulo: Puede rendir directamente (no hay parciales)
        
        Args:
            estudiante: Instancia de Estudiante
            bloque: Instancia de Bloque
            
        Returns:
            True si está habilitado
            
        Raises:
            ValidationError si no cumple los requisitos
        """
        modulos = bloque.modulos.all()
        
        if modulos.count() > 1:
            # Caso: Bloque con múltiples módulos
            for modulo in modulos:
                # Buscar parcial aprobado del módulo
                parcial_aprobado = Nota.objects.filter(
                    estudiante=estudiante,
                    examen__modulo=modulo,
                    examen__tipo_examen=Examen.PARCIAL,
                    aprobado=True
                ).exists()
                
                if not parcial_aprobado:
                    raise ValidationError(
                        f"El estudiante debe aprobar el parcial del módulo '{modulo.nombre}' "
                        f"antes de rendir el Final Virtual del bloque '{bloque.nombre}'"
                    )
        
        # Si llegó hasta acá, está habilitado
        return True
    
    @staticmethod
    def puede_rendir_final_sincronico(estudiante, bloque):
        """
        Verifica si un estudiante puede rendir el Final Sincrónico del bloque.
        
        Reglas:
        1. Debe tener aprobado el Final Virtual del mismo bloque
        2. El Virtual debe ser del "ciclo actual" (no invalidado por desaprobación previa)
        3. Si desaprobó un Sincrónico después del Virtual, debe volver a rendir Virtual
        
        Args:
            estudiante: Instancia de Estudiante
            bloque: Instancia de Bloque
            
        Returns:
            dict con:
                - habilitado: bool
                - virtual: Nota del virtual que habilita (si existe)
                - mensaje: str con explicación
            
        Raises:
            ValidationError si no está habilitado
        """
        # Buscar última nota de Final Virtual para este bloque
        ultima_virtual = Nota.objects.filter(
            estudiante=estudiante,
            examen__bloque=bloque,
            examen__tipo_examen=Examen.FINAL_VIRTUAL
        ).order_by('-fecha_calificacion').first()
        
        if not ultima_virtual:
            raise ValidationError(
                f"El estudiante debe rendir primero el Final Virtual del bloque '{bloque.nombre}'"
            )
        
        if not ultima_virtual.aprobado:
            raise ValidationError(
                f"El estudiante debe aprobar el Final Virtual del bloque '{bloque.nombre}' "
                f"(nota actual: {ultima_virtual.calificacion})"
            )
        
        # Verificar que no haya reprobado un Sincrónico posterior a este Virtual
        sinc_posterior_reprobado = Nota.objects.filter(
            estudiante=estudiante,
            examen__bloque=bloque,
            examen__tipo_examen=Examen.FINAL_SINC,
            fecha_calificacion__gt=ultima_virtual.fecha_calificacion,
            aprobado=False
        ).exists()
        
        if sinc_posterior_reprobado:
            raise ValidationError(
                f"El estudiante desaprobó un intento de Final Sincrónico después del último Virtual aprobado. "
                f"Debe volver a rendir el Final Virtual del bloque '{bloque.nombre}'"
            )
        
        return {
            'habilitado': True,
            'virtual': ultima_virtual,
            'mensaje': 'El estudiante puede rendir el Final Sincrónico'
        }
    
    @staticmethod
    @transaction.atomic
    def registrar_nota_final_sincronico(estudiante, examen_sinc, calificacion, habilitado_por=None):
        """
        Registra una nota de Final Sincrónico con toda la lógica asociada.
        
        Acciones:
        - Calcula el número de intento
        - Vincula con el Virtual que lo habilitó
        - Si aprueba: Marca como nota definitiva y desmarca las anteriores
        - Si desaprueba: No marca como definitiva (deberá volver a Virtual)
        
        Args:
            estudiante: Instancia de Estudiante
            examen_sinc: Instancia de Examen (tipo FINAL_SINC)
            calificacion: Decimal/float con la nota
            habilitado_por: Nota del Virtual que habilitó (opcional, se busca automáticamente)
            
        Returns:
            Nota creada
        """
        if examen_sinc.tipo_examen != Examen.FINAL_SINC:
            raise ValidationError("El examen debe ser de tipo Final Sincrónico")
        
        # Si no se provee habilitado_por, buscar el último Virtual aprobado
        if not habilitado_por:
            habilitado_por = Nota.objects.filter(
                estudiante=estudiante,
                examen__bloque=examen_sinc.bloque,
                examen__tipo_examen=Examen.FINAL_VIRTUAL,
                aprobado=True
            ).order_by('-fecha_calificacion').first()
        
        # Calcular número de intento
        intento = Nota.objects.filter(
            estudiante=estudiante,
            examen=examen_sinc
        ).count() + 1
        
        # Determinar si aprueba
        aprobado = calificacion >= 6
        
        # Crear la nota
        nota = Nota.objects.create(
            examen=examen_sinc,
            estudiante=estudiante,
            calificacion=calificacion,
            aprobado=aprobado,
            intento=intento,
            habilitado_por=habilitado_por,
            es_nota_definitiva=aprobado  # Solo es definitiva si aprueba
        )
        
        if aprobado:
            # Marcar como NO definitivas las notas anteriores de este mismo examen
            Nota.objects.filter(
                estudiante=estudiante,
                examen=examen_sinc,
                es_nota_definitiva=True
            ).exclude(id=nota.id).update(es_nota_definitiva=False)
        
        return nota
    
    @staticmethod
    def registrar_nota_parcial(estudiante, examen_parcial, calificacion):
        """
        Registra una nota de Parcial o Recuperatorio.
        
        Args:
            estudiante: Instancia de Estudiante
            examen_parcial: Instancia de Examen (tipo PARCIAL o RECUP)
            calificacion: Decimal/float con la nota
            
        Returns:
            Nota creada
        """
        if examen_parcial.tipo_examen not in [Examen.PARCIAL, Examen.RECUP]:
            raise ValidationError("El examen debe ser de tipo Parcial o Recuperatorio")
        
        # Calcular número de intento
        intento = Nota.objects.filter(
            estudiante=estudiante,
            examen=examen_parcial
        ).count() + 1
        
        # Determinar si aprueba
        aprobado = calificacion >= 6
        
        # Crear la nota
        nota = Nota.objects.create(
            examen=examen_parcial,
            estudiante=estudiante,
            calificacion=calificacion,
            aprobado=aprobado,
            intento=intento,
            es_nota_definitiva=False  # Los parciales no son notas definitivas
        )
        
        return nota
    
    @staticmethod
    def get_nota_definitiva_bloque(estudiante, bloque):
        """
        Obtiene la nota definitiva de un bloque para un estudiante.
        
        La nota definitiva es la última nota de Final Sincrónico aprobada.
        
        Args:
            estudiante: Instancia de Estudiante
            bloque: Instancia de Bloque
            
        Returns:
            Nota si existe, None si no ha aprobado
        """
        return Nota.objects.filter(
            estudiante=estudiante,
            examen__bloque=bloque,
            examen__tipo_examen=Examen.FINAL_SINC,
            aprobado=True,
            es_nota_definitiva=True
        ).order_by('-fecha_calificacion').first()
    
    @staticmethod
    def get_historial_intentos_bloque(estudiante, bloque):
        """
        Obtiene el historial completo de intentos de un estudiante en un bloque.
        
        Retorna todas las notas (parciales, virtual, sincrónico) ordenadas cronológicamente.
        
        Args:
            estudiante: Instancia de Estudiante
            bloque: Instancia de Bloque
            
        Returns:
            QuerySet de Nota ordenado por fecha
        """
        # Notas de exámenes del bloque directamente
        notas_bloque = Nota.objects.filter(
            estudiante=estudiante,
            examen__bloque=bloque
        )
        
        # Notas de parciales de módulos del bloque
        notas_modulos = Nota.objects.filter(
            estudiante=estudiante,
            examen__modulo__bloque=bloque
        )
        
        # Combinar y ordenar
        todas_notas = (notas_bloque | notas_modulos).order_by('fecha_calificacion')
        
        return todas_notas
    
    @staticmethod
    def get_estado_evaluacion_bloque(estudiante, bloque):
        """
        Obtiene el estado completo de evaluación de un estudiante en un bloque.
        
        Returns:
            dict con:
                - aprobado: bool
                - nota_final: Decimal (si aprobó)
                - puede_virtual: bool
                - puede_sincronico: bool
                - historial: list de notas
                - siguiente_paso: str con mensaje
        """
        nota_definitiva = EvaluacionService.get_nota_definitiva_bloque(estudiante, bloque)
        
        if nota_definitiva:
            return {
                'aprobado': True,
                'nota_final': nota_definitiva.calificacion,
                'puede_virtual': False,
                'puede_sincronico': False,
                'historial': list(EvaluacionService.get_historial_intentos_bloque(estudiante, bloque)),
                'siguiente_paso': f'Bloque aprobado con nota {nota_definitiva.calificacion}'
            }
        
        # Verificar si puede rendir Virtual
        puede_virtual = False
        mensaje_virtual = ""
        try:
            EvaluacionService.puede_rendir_final_virtual(estudiante, bloque)
            puede_virtual = True
            mensaje_virtual = "Puede rendir Final Virtual"
        except ValidationError as e:
            mensaje_virtual = str(e)
        
        # Verificar si puede rendir Sincrónico
        puede_sincronico = False
        mensaje_sincronico = ""
        try:
            result = EvaluacionService.puede_rendir_final_sincronico(estudiante, bloque)
            puede_sincronico = result['habilitado']
            mensaje_sincronico = result['mensaje']
        except ValidationError as e:
            mensaje_sincronico = str(e)
        
        # Determinar siguiente paso
        if puede_sincronico:
            siguiente_paso = "Puede rendir Final Sincrónico"
        elif puede_virtual:
            siguiente_paso = "Puede rendir Final Virtual"
        else:
            siguiente_paso = mensaje_virtual
        
        return {
            'aprobado': False,
            'nota_final': None,
            'puede_virtual': puede_virtual,
            'puede_sincronico': puede_sincronico,
            'mensaje_virtual': mensaje_virtual,
            'mensaje_sincronico': mensaje_sincronico,
            'historial': list(EvaluacionService.get_historial_intentos_bloque(estudiante, bloque)),
            'siguiente_paso': siguiente_paso
        }
