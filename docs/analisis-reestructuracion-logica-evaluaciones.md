# Análisis y Reestructuración: Lógica de Evaluaciones CFP

## 📋 Índice
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Reglas de Negocio Definidas](#reglas-de-negocio-definidas)
3. [Estado Actual del Sistema](#estado-actual-del-sistema)
4. [Análisis de Brechas](#análisis-de-brechas)
5. [Propuesta de Reestructuración](#propuesta-de-reestructuración)
6. [Plan de Implementación](#plan-de-implementación)

---

## 📊 Resumen Ejecutivo

### ✅ Lo que funciona bien
- Estructura jerárquica: Programa → Bloque → Módulos
- Tipos de examen ya definidos (PARCIAL, FINAL_VIRTUAL, FINAL_SINC)
- Sistema de notas con historial completo
- Cohortes vinculadas a Programa + Calendario

### ⚠️ Lo que necesita ajustes
- Falta concepto de **Resoluciones** (marco legal)
- Lógica de habilitación entre exámenes no está implementada
- No hay control de secuencia Virtual → Sincrónico
- Falta identificación de "nota definitiva"
- No hay validación de desaprobación de sincrónico = volver a virtual

---

## 🎯 Reglas de Negocio Definidas

### 1️⃣ **Jerarquía Organizacional**

```
RESOLUCIÓN (Marco legal - NUEVO)
  └── CAPACITACIÓN
       └── BLOQUE (Materia)
            └── MÓDULOS (Flexibles: 1, 2, 3... según resolución)
                 └── INSTANCIA DE DICTADO (Cohorte)
                      └── EVALUACIONES
```

**Flexibilidad requerida:**
- ✅ Cantidad de módulos por bloque: Variable
- ✅ Duración de cada módulo: Configurable
- ✅ Frecuencia de dictado: Por cohorte (no predefinida)

---

### 2️⃣ **Lógica de Evaluación por Tipo de Bloque**

#### **Caso A: Bloque con MÚLTIPLES Módulos**
```
BLOQUE: Programación 1 (con M1 y M2)
  ├── Módulo 1 (M1)
  │    └── PARCIAL M1 (debe aprobar)
  ├── Módulo 2 (M2)
  │    └── PARCIAL M2 (debe aprobar)
  └── Si aprobó TODOS los parciales:
       ├── FINAL VIRTUAL → Aprueba/Desaprueba (HABILITANTE)
       │    └── Si aprueba → Habilita FINAL SINCRÓNICO
       └── FINAL SINCRÓNICO → NOTA DEFINITIVA del bloque
```

#### **Caso B: Bloque con UN SOLO Módulo**
```
BLOQUE: Relaciones Laborales (sin partir)
  └── Módulo Único
       └── Sin parcial, directamente:
            ├── FINAL VIRTUAL → Aprueba/Desaprueba (HABILITANTE)
            └── FINAL SINCRÓNICO → NOTA DEFINITIVA del bloque
```

---

### 3️⃣ **Flujo de Evaluación Final (2 Etapas)**

#### **Etapa 1: Final Virtual**
- 🎯 **Propósito**: Examen habilitante (filtro)
- 📊 **Resultado**: Nota numérica que se registra
- ✅ **Aprueba (≥6)**: Habilita para Final Sincrónico
- ❌ **Desaprueba (<6)**: Debe volver a rendir Virtual
- ⚠️ **IMPORTANTE**: La nota se guarda pero **NO es la definitiva**

#### **Etapa 2: Final Sincrónico**
- 🎯 **Propósito**: Evaluación definitiva presencial
- 📊 **Resultado**: Nota numérica (1-10)
- 🏆 **Esta es la NOTA DEFINITIVA del bloque**
- ✅ **Aprueba (≥6)**: Bloque completo aprobado
- ❌ **Desaprueba (<6)**: **REINICIA TODO** → Debe volver a Virtual

---

### 4️⃣ **Regla de Reinicio por Desaprobación**

**Si el estudiante desaprueba el Final Sincrónico:**

```
┌─────────────────────────────────────┐
│ Final Sincrónico DESAPROBADO (<6)  │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Pierde habilitación  │
    │ del Virtual anterior │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Debe rendir nuevamente:  │
    │ 1. Final Virtual         │
    │ 2. Final Sincrónico      │
    └──────────────────────────┘
```

**Ejemplo:**
```
Intento 1:
  - Virtual: 7 ✅ → Habilita
  - Sincrónico: 3 ❌ → DESAPRUEBA

Intento 2: (Empieza de nuevo)
  - Virtual: 6 ✅ → Habilita
  - Sincrónico: 8 ✅ → APRUEBA con 8
  
Nota final del bloque: 8
```

---

### 5️⃣ **Registro de Todas las Notas**

**Principio:** TODAS las notas se registran en el sistema (trazabilidad completa)

| Evaluación | Se registra | Es nota definitiva | Propósito |
|------------|-------------|-------------------|-----------|
| Parcial M1 | ✅ | ❌ | Habilita para continuar |
| Parcial M2 | ✅ | ❌ | Habilita para Finals |
| Final Virtual | ✅ | ❌ | Habilita Sincrónico |
| Final Sincrónico | ✅ | ✅ | **NOTA DEFINITIVA** |

**Ejemplo de historial completo:**
```
Estudiante: Juan Pérez
Bloque: Programación 1

┌──────────────────┬─────────┬────────┬──────┬─────────────────┐
│ Evaluación       │ Intento │ Fecha  │ Nota │ Estado          │
├──────────────────┼─────────┼────────┼──────┼─────────────────┤
│ Parcial M1       │    1    │ Mar 15 │  8   │ Aprobado        │
│ Parcial M2       │    1    │ Abr 20 │  7   │ Aprobado        │
│ Final Virtual    │    1    │ May 10 │  7   │ Habilitó        │
│ Final Sincrónico │    1    │ May 25 │  3   │ DESAPROBADO     │
│ Final Virtual    │    2    │ Jun 15 │  6   │ Habilitó        │
│ Final Sincrónico │    2    │ Jun 30 │  9   │ ✅ APROBADO     │
└──────────────────┴─────────┴────────┴──────┴─────────────────┘

NOTA DEFINITIVA DEL BLOQUE: 9
```

---

## 🔍 Estado Actual del Sistema

### **Modelos Existentes**

#### ✅ `Programa`
```python
class Programa(TimeStamped):
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=200)
    activo = models.BooleanField(default=True)
```
**Estado:** OK - No requiere cambios

---

#### ✅ `Bloque`
```python
class Bloque(TimeStamped):
    programa = models.ForeignKey(Programa, related_name="bloques")
    nombre = models.CharField(max_length=120)
    orden = models.PositiveIntegerField(default=1)
    correlativas = models.ManyToManyField('self', blank=True)
```
**Estado:** OK - No requiere cambios

---

#### ✅ `Modulo`
```python
class Modulo(TimeStamped):
    bloque = models.ForeignKey(Bloque, related_name="modulos")
    nombre = models.CharField(max_length=120)
    orden = models.PositiveIntegerField(default=1)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    es_practica = models.BooleanField(default=False)
    asistencia_requerida_practica = models.PositiveIntegerField(default=80)
```
**Estado:** OK - Flexible como requerido

---

#### ⚠️ `Examen` - Requiere ajustes
```python
class Examen(TimeStamped):
    PARCIAL = "PARCIAL"
    RECUP = "RECUP"
    FINAL_VIRTUAL = "FINAL_VIRTUAL"
    FINAL_SINC = "FINAL_SINC"
    EQUIVALENCIA = "EQUIVALENCIA"
    
    modulo = models.ForeignKey(Modulo, null=True, blank=True)
    bloque = models.ForeignKey(Bloque, null=True, blank=True)
    tipo_examen = models.CharField(max_length=15, choices=TIPOS_EXAMEN)
    fecha = models.DateField(null=True, blank=True)
    peso = models.DecimalField(max_digits=5, decimal_places=2, default=0)
```

**Validaciones actuales:**
```python
def clean(self):
    # Parciales/Recup solo en módulos
    if self.modulo and self.tipo_examen not in [PARCIAL, RECUP]:
        raise ValidationError(...)
    
    # Finals solo en bloques
    if self.bloque and self.tipo_examen not in [FINAL_VIRTUAL, FINAL_SINC, EQUIVALENCIA]:
        raise ValidationError(...)
```

**Estado:** ✅ Estructura correcta | ⚠️ Falta lógica de secuencia

---

#### ⚠️ `Nota` - Requiere ajustes
```python
class Nota(TimeStamped):
    examen = models.ForeignKey(Examen, related_name="notas")
    estudiante = models.ForeignKey(Estudiante, related_name="notas")
    calificacion = models.DecimalField(max_digits=5, decimal_places=2)
    aprobado = models.BooleanField(default=False)
    fecha_calificacion = models.DateTimeField(null=True, blank=True)
    es_equivalencia = models.BooleanField(default=False)
    origen_equivalencia = models.CharField(max_length=255, blank=True)
    fecha_ref_equivalencia = models.DateField(null=True, blank=True)
```

**Estado:** ✅ Guarda todas las notas | ⚠️ No identifica cuál es la definitiva

---

## ⚠️ Análisis de Brechas

### **GAP 1: Falta modelo `Resolución`**
**Necesidad:** Marco legal que agrupa programas

**Impacto:** Alto - Es requerimiento nuevo

**Solución:** Crear nuevo modelo

---

### **GAP 2: No hay control de habilitación secuencial**
**Necesidad:** 
- Virtual aprobado → Habilita Sincrónico
- Sincrónico desaprobado → Vuelve a Virtual

**Impacto:** Crítico - Lógica de negocio central

**Solución:** Implementar en service/validators

---

### **GAP 3: No hay identificador de "nota definitiva"**
**Necesidad:** Saber cuál es la nota final que cuenta

**Impacto:** Alto - Cálculo de aprobación

**Estado actual:** La lógica está implícita (última nota de tipo FINAL_SINC aprobada)

**Solución:** 
- Opción A: Agregar campo `es_nota_definitiva` en Nota
- Opción B: Query que busca última FINAL_SINC aprobada

---

### **GAP 4: No hay control de intentos**
**Necesidad:** Permitir múltiples intentos Virtual/Sincrónico

**Estado actual:** Se pueden crear múltiples registros de notas

**Solución:** ✅ Ya funciona - Solo falta validar la secuencia

---

### **GAP 5: No hay validación de prerrequisitos**
**Necesidad:** No permitir sincrónico sin virtual aprobado

**Impacto:** Crítico

**Solución:** Validación en API antes de crear examen/nota

---

## 🛠️ Propuesta de Reestructuración

### **Cambio 1: Agregar modelo `Resolución`**

```python
class Resolucion(TimeStamped):
    """
    Marco legal que habilita la oferta de capacitaciones.
    Ejemplo: Resolución 3601/2023
    """
    numero = models.CharField(max_length=50, unique=True, 
                              help_text="Ej: 3601/2023")
    nombre = models.CharField(max_length=200, 
                              help_text="Nombre descriptivo de la resolución")
    fecha_publicacion = models.DateField(
                              help_text="Fecha de publicación oficial")
    vigente = models.BooleanField(default=True)
    observaciones = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-fecha_publicacion']
        verbose_name = "Resolución"
        verbose_name_plural = "Resoluciones"
    
    def __str__(self):
        return f"Resolución {self.numero}"
```

**Modificar modelo `Programa`:**
```python
class Programa(TimeStamped):
    resolucion = models.ForeignKey(Resolucion, on_delete=models.PROTECT, 
                                   related_name="programas",
                                   help_text="Marco legal que habilita este programa")
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=200)
    activo = models.BooleanField(default=True)
```

---

### **Cambio 2: Agregar campo de secuencia en `Nota`**

```python
class Nota(TimeStamped):
    examen = models.ForeignKey(Examen, related_name="notas")
    estudiante = models.ForeignKey(Estudiante, related_name="notas")
    calificacion = models.DecimalField(max_digits=5, decimal_places=2)
    aprobado = models.BooleanField(default=False)
    fecha_calificacion = models.DateTimeField(null=True, blank=True)
    
    # NUEVOS CAMPOS
    intento = models.PositiveIntegerField(default=1,
                                          help_text="Número de intento (1, 2, 3...)")
    es_nota_definitiva = models.BooleanField(default=False,
                                             help_text="True si es la nota final que cuenta")
    habilitado_por = models.ForeignKey('self', null=True, blank=True,
                                       on_delete=models.SET_NULL,
                                       related_name='habilita_a',
                                       help_text="Nota de Virtual que habilitó este Sincrónico")
    
    # Campos existentes de equivalencia
    es_equivalencia = models.BooleanField(default=False)
    origen_equivalencia = models.CharField(max_length=255, blank=True)
    fecha_ref_equivalencia = models.DateField(null=True, blank=True)
    
    class Meta:
        ordering = ['-fecha_calificacion']
        indexes = [
            models.Index(fields=["examen", "estudiante", "intento"]),
            models.Index(fields=["estudiante", "es_nota_definitiva"]),
        ]
```

---

### **Cambio 3: Service de Validación de Habilitación**

```python
# backend/core/services/evaluacion_service.py

from django.core.exceptions import ValidationError
from core.models import Nota, Examen, Bloque

class EvaluacionService:
    """
    Servicio para manejar la lógica de habilitación y secuencia de evaluaciones
    """
    
    @staticmethod
    def puede_rendir_final_sincronico(estudiante, bloque):
        """
        Verifica si el estudiante puede rendir el Final Sincrónico del bloque.
        
        Requisitos:
        1. Debe tener aprobado el Final Virtual (nota ≥6)
        2. El Final Virtual debe ser del mismo "ciclo" (no invalidado por desaprobación previa)
        """
        # Buscar última nota de Final Virtual para este bloque
        ultima_virtual = Nota.objects.filter(
            estudiante=estudiante,
            examen__bloque=bloque,
            examen__tipo_examen=Examen.FINAL_VIRTUAL
        ).order_by('-fecha_calificacion').first()
        
        if not ultima_virtual:
            raise ValidationError(
                f"El estudiante debe rendir primero el Final Virtual del bloque {bloque.nombre}"
            )
        
        if not ultima_virtual.aprobado:
            raise ValidationError(
                f"El estudiante debe aprobar el Final Virtual (actual: {ultima_virtual.calificacion})"
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
                "El estudiante debe volver a rendir el Final Virtual "
                "porque desaprobó un intento previo del Final Sincrónico"
            )
        
        return True
    
    @staticmethod
    def puede_rendir_final_virtual(estudiante, bloque):
        """
        Verifica si el estudiante puede rendir el Final Virtual del bloque.
        
        Para bloques con múltiples módulos:
        - Debe tener aprobados TODOS los parciales de los módulos
        
        Para bloques con un solo módulo:
        - No hay parcial, puede rendir directamente
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
                        f"El estudiante debe aprobar el parcial del módulo {modulo.nombre}"
                    )
        
        # Si llegó hasta acá, está habilitado
        return True
    
    @staticmethod
    def registrar_nota_final_sincronico(estudiante, examen_sinc, calificacion):
        """
        Registra una nota de Final Sincrónico y actualiza estados.
        
        Si aprueba: Marca esta nota como definitiva
        Si desaprueba: Invalida la habilitación del Virtual previo
        """
        # Buscar el Virtual que lo habilitó
        ultima_virtual = Nota.objects.filter(
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
        
        # Crear la nota
        aprobado = calificacion >= 6
        nota = Nota.objects.create(
            examen=examen_sinc,
            estudiante=estudiante,
            calificacion=calificacion,
            aprobado=aprobado,
            intento=intento,
            habilitado_por=ultima_virtual,
            es_nota_definitiva=aprobado  # Solo es definitiva si aprueba
        )
        
        if aprobado:
            # Marcar como NO definitivas las notas anteriores de este examen
            Nota.objects.filter(
                estudiante=estudiante,
                examen=examen_sinc,
                es_nota_definitiva=True
            ).exclude(id=nota.id).update(es_nota_definitiva=False)
        
        return nota
    
    @staticmethod
    def get_nota_definitiva_bloque(estudiante, bloque):
        """
        Obtiene la nota definitiva del bloque para un estudiante.
        Retorna la última nota de Final Sincrónico aprobada.
        """
        return Nota.objects.filter(
            estudiante=estudiante,
            examen__bloque=bloque,
            examen__tipo_examen=Examen.FINAL_SINC,
            aprobado=True,
            es_nota_definitiva=True
        ).order_by('-fecha_calificacion').first()
```

---

### **Cambio 4: Actualizar API Endpoints**

```python
# backend/core/api/examenes.py

from ninja import Router
from django.shortcuts import get_object_or_404
from core.models import Examen, Nota, Estudiante, Bloque
from core.services.evaluacion_service import EvaluacionService
from core.api.permissions import require_authenticated_group

router = Router(tags=["examenes"])

@router.post("/registrar-nota-final-sincronico")
@require_authenticated_group
def registrar_nota_final_sincronico(request, payload: dict):
    """
    Registra una nota de Final Sincrónico con validaciones de habilitación.
    
    Payload esperado:
    {
        "estudiante_id": 123,
        "examen_id": 45,
        "calificacion": 8
    }
    """
    estudiante = get_object_or_404(Estudiante, pk=payload['estudiante_id'])
    examen = get_object_or_404(Examen, pk=payload['examen_id'])
    
    # Validar que es un examen de tipo FINAL_SINC
    if examen.tipo_examen != Examen.FINAL_SINC:
        return {"error": "El examen debe ser de tipo Final Sincrónico"}, 400
    
    # Validar habilitación
    try:
        EvaluacionService.puede_rendir_final_sincronico(estudiante, examen.bloque)
    except ValidationError as e:
        return {"error": str(e)}, 400
    
    # Registrar la nota
    nota = EvaluacionService.registrar_nota_final_sincronico(
        estudiante=estudiante,
        examen_sinc=examen,
        calificacion=payload['calificacion']
    )
    
    return {
        "success": True,
        "nota_id": nota.id,
        "aprobado": nota.aprobado,
        "es_nota_definitiva": nota.es_nota_definitiva,
        "mensaje": f"Nota registrada: {nota.calificacion}" + 
                   (" - APROBADO" if nota.aprobado else " - DESAPROBADO (debe volver a Virtual)")
    }

@router.get("/estudiante/{estudiante_id}/bloque/{bloque_id}/puede-rendir-sincronico")
@require_authenticated_group
def puede_rendir_sincronico(request, estudiante_id: int, bloque_id: int):
    """
    Verifica si un estudiante puede rendir el Final Sincrónico de un bloque.
    """
    estudiante = get_object_or_404(Estudiante, pk=estudiante_id)
    bloque = get_object_or_404(Bloque, pk=bloque_id)
    
    try:
        EvaluacionService.puede_rendir_final_sincronico(estudiante, bloque)
        return {"habilitado": True, "mensaje": "El estudiante puede rendir el Final Sincrónico"}
    except ValidationError as e:
        return {"habilitado": False, "mensaje": str(e)}

@router.get("/estudiante/{estudiante_id}/bloque/{bloque_id}/nota-definitiva")
@require_authenticated_group
def nota_definitiva_bloque(request, estudiante_id: int, bloque_id: int):
    """
    Obtiene la nota definitiva de un bloque para un estudiante.
    """
    estudiante = get_object_or_404(Estudiante, pk=estudiante_id)
    bloque = get_object_or_404(Bloque, pk=bloque_id)
    
    nota = EvaluacionService.get_nota_definitiva_bloque(estudiante, bloque)
    
    if nota:
        return {
            "tiene_nota": True,
            "calificacion": float(nota.calificacion),
            "fecha": nota.fecha_calificacion.isoformat(),
            "intento": nota.intento
        }
    else:
        return {"tiene_nota": False, "mensaje": "El bloque aún no está aprobado"}
```

---

## 📅 Plan de Implementación

### **Fase 1: Modelo de Resoluciones** (1-2 días)
**Prioridad:** Media

1. ✅ Crear migración para modelo `Resolucion`
2. ✅ Agregar FK `resolucion` a `Programa`
3. ✅ Crear CRUD en admin de Django
4. ✅ Actualizar frontend para gestionar resoluciones
5. ✅ Migrar programas existentes (crear resolución "Legado")

**Archivos a modificar:**
- `backend/core/models.py`
- `backend/core/admin.py`
- `backend/core/api/resoluciones.py` (nuevo)
- `frontend/src/pages/Resoluciones.jsx` (nuevo)

---

### **Fase 2: Lógica de Habilitación** (3-4 días)
**Prioridad:** CRÍTICA

1. ✅ Agregar campos a modelo `Nota` (intento, es_nota_definitiva, habilitado_por)
2. ✅ Crear `EvaluacionService`
3. ✅ Implementar validaciones de habilitación
4. ✅ Actualizar endpoints de registro de notas
5. ✅ Crear tests unitarios

**Archivos a modificar:**
- `backend/core/models.py`
- `backend/core/services/evaluacion_service.py` (nuevo)
- `backend/core/api/examenes.py`
- `backend/core/tests/test_evaluacion_service.py` (nuevo)

---

### **Fase 3: Frontend de Evaluaciones** (2-3 días)
**Prioridad:** Alta

1. ✅ Actualizar componente de registro de notas
2. ✅ Mostrar estado de habilitación
3. ✅ Validaciones en frontend (antes de enviar)
4. ✅ Vista de historial de intentos
5. ✅ Indicador visual de "nota definitiva"

**Archivos a modificar:**
- `frontend/src/pages/Notas.jsx`
- `frontend/src/components/RegistroNotaDialog.jsx`
- `frontend/src/components/HistorialIntentosEstudiante.jsx` (nuevo)

---

### **Fase 4: Reportes y Estadísticas** (1-2 días)
**Prioridad:** Media

1. ✅ Dashboard de aprobación por bloque
2. ✅ Estadísticas de intentos (cuántos llegan a Virtual, cuántos a Sincrónico)
3. ✅ Reporte de estudiantes que deben volver a Virtual
4. ✅ Exportación de notas definitivas

**Archivos a crear:**
- `backend/core/api/reportes_evaluacion.py`
- `frontend/src/pages/ReportesEvaluacion.jsx`

---

## 🧪 Casos de Prueba

### **Test 1: Secuencia normal completa**
```
Estudiante: Test User
Bloque: Programación 1 (con M1 y M2)

1. Rendir Parcial M1 → 8 ✅
2. Rendir Parcial M2 → 7 ✅
3. Rendir Final Virtual → 7 ✅
4. Rendir Final Sincrónico → 9 ✅

Resultado esperado: APROBADO con nota definitiva 9
```

---

### **Test 2: Desaprobación de Virtual**
```
1. Parcial M1 → 8 ✅
2. Parcial M2 → 7 ✅
3. Final Virtual → 4 ❌
4. Intentar Final Sincrónico → ERROR (no habilitado)
5. Final Virtual (intento 2) → 6 ✅
6. Final Sincrónico → 8 ✅

Resultado esperado: APROBADO con nota definitiva 8
```

---

### **Test 3: Desaprobación de Sincrónico (Reinicio)**
```
1. Parcial M1 → 8 ✅
2. Parcial M2 → 7 ✅
3. Final Virtual (intento 1) → 7 ✅
4. Final Sincrónico (intento 1) → 4 ❌
5. Intentar Final Sincrónico de nuevo → ERROR (debe volver a Virtual)
6. Final Virtual (intento 2) → 6 ✅
7. Final Sincrónico (intento 2) → 9 ✅

Resultado esperado: APROBADO con nota definitiva 9
Historial: 7 intentos registrados
```

---

### **Test 4: Bloque con un solo módulo**
```
Bloque: Relaciones Laborales (módulo único)

1. Intentar Parcial → ERROR (no hay parcial en bloque de módulo único)
2. Final Virtual → 7 ✅
3. Final Sincrónico → 8 ✅

Resultado esperado: APROBADO con nota definitiva 8
```

---

## 📊 Resumen de Cambios

| Componente | Estado Actual | Cambio Necesario | Prioridad |
|------------|---------------|------------------|-----------|
| Modelo `Resolucion` | ❌ No existe | ✅ Crear nuevo | Media |
| Modelo `Programa` | ✅ OK | ⚠️ Agregar FK resolucion | Media |
| Modelo `Examen` | ✅ OK | ✅ No requiere cambios | - |
| Modelo `Nota` | ⚠️ Incompleto | ✅ Agregar campos de secuencia | Crítica |
| Service Evaluación | ❌ No existe | ✅ Crear completo | Crítica |
| API Examenes | ⚠️ Básico | ✅ Agregar validaciones | Alta |
| Frontend Notas | ⚠️ Básico | ✅ Mejorar UX y validaciones | Alta |

---

## 🎯 Conclusión

El sistema CFP actual tiene una **base sólida** pero necesita:

1. **Agregar Resoluciones** (nuevo concepto organizacional)
2. **Implementar lógica de habilitación** (crítico para el flujo de evaluación)
3. **Identificar notas definitivas** (cálculo de aprobación correcto)
4. **Validar secuencias** (Virtual → Sincrónico → Reinicio si desaprueba)

**Esfuerzo estimado:** 8-11 días de desarrollo + testing

**Riesgo:** Bajo - Los cambios son aditivos, no destructivos

**Recomendación:** Implementar por fases, comenzando por la lógica de habilitación (Fase 2) que es la más crítica.
