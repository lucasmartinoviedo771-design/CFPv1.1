# Explicación Detallada: Sección Administración del CFP

## Índice
1. [Visión General](#visión-general)
2. [Estructura Académica](#1-estructura-académica)
3. [Programas](#2-programas)
4. [Calendario Académico](#3-calendario-académico)
5. [Cohortes](#4-cohortes)
6. [Gráfico de Cursos](#5-gráfico-de-cursos)
7. [Arquitectura Técnica](#arquitectura-técnica)

---

## Visión General

La sección de **Administración** del CFP es el núcleo de gestión académica del sistema. Permite configurar y administrar toda la estructura educativa del centro de formación profesional. Los elementos se organizan jerárquicamente y se relacionan entre sí para crear un sistema completo de gestión académica.

**Jerarquía conceptual:**
```
Programa (Ej: "Técnico en Informática")
  └── Bloques (Ej: "Bloque 1 - Fundamentos")
       └── Módulos (Ej: "Introducción a la Programación")
            └── Exámenes
```

**Modelo de cursada:**
```
Cohorte = Programa + Calendario Académico
         ↓
    Define cuándo y cómo se cursa un programa específico
```

---

## 1. Estructura Académica

### ¿Qué es?
Es un **editor jerárquico completo** que permite diseñar la estructura curricular de los programas educativos. Es como un "árbol de contenidos" donde defines qué se enseña y en qué orden.

### Componentes

#### 1.1 Programas
**Propósito:** Representan carreras o cursos completos (Ej: "Técnico Superior en Desarrollo Web")

**Campos:**
- `codigo`: Identificador único del programa (Ej: "TDW-2024")
- `nombre`: Nombre descriptivo del programa
- `activo`: Indica si el programa está disponible para inscripciones

**Endpoints del Backend:**
```
GET    /api/programas                    → Lista todos los programas
GET    /api/programas/{id}               → Detalle de un programa específico
POST   /api/programas                    → Crear nuevo programa
PUT    /api/programas/{id}               → Actualizar programa
DELETE /api/programas/{id}               → Eliminar programa
```

**Archivo Backend:** `/backend/core/api/programas.py`

#### 1.2 Bloques
**Propósito:** Dividen un programa en secciones lógicas (Ej: "Bloque 1: Fundamentos", "Bloque 2: Avanzado")

**Campos:**
- `nombre`: Nombre del bloque
- `orden`: Posición dentro del programa (permite ordenar los bloques)
- `programa_id`: Referencia al programa padre
- `correlativas`: Lista de bloques que deben completarse antes

**Endpoints del Backend:**
```
GET    /api/bloques?programa_id={id}     → Lista bloques de un programa
GET    /api/bloques/{id}                 → Detalle de un bloque
POST   /api/bloques                      → Crear nuevo bloque
PUT    /api/bloques/{id}                 → Actualizar bloque
DELETE /api/bloques/{id}                 → Eliminar bloque
```

**Archivo Backend:** `/backend/core/api/bloques.py`

**Funcionalidad especial:** Los bloques pueden tener **correlativas**, es decir, bloques que deben aprobarse antes de cursar este bloque.

#### 1.3 Módulos
**Propósito:** Son las materias o asignaturas individuales dentro de un bloque

**Campos:**
- `nombre`: Nombre del módulo (Ej: "Python Básico")
- `bloque_id`: Referencia al bloque padre
- `orden`: Posición dentro del bloque
- `fecha_inicio`: Fecha de inicio del módulo (opcional)
- `fecha_fin`: Fecha de finalización del módulo (opcional)
- `es_practica`: Booleano que indica si es un módulo práctico
- `asistencia_requerida_practica`: Porcentaje de asistencia necesario (si es práctica)

**Endpoints del Backend:**
```
GET    /api/modulos?bloque_id={id}       → Lista módulos de un bloque
GET    /api/modulos/{id}                 → Detalle de un módulo
POST   /api/modulos                      → Crear nuevo módulo
PUT    /api/modulos/{id}                 → Actualizar módulo
DELETE /api/modulos/{id}                 → Eliminar módulo
```

**Archivo Backend:** `/backend/core/api/modulos.py`

### Funcionalidad del Frontend

**Archivo:** `/frontend/src/pages/Estructura.jsx` (577 líneas)

**Características principales:**
1. **Vista de acordeones anidados**: Programa → Bloques → Módulos
2. **CRUD completo**: Crear, editar y eliminar en los tres niveles
3. **Diálogos modales** para formularios de edición
4. **Validación de datos** antes de enviar al backend
5. **Feedback visual** con notificaciones de éxito/error

**Flujo de trabajo típico:**
```
1. Usuario crea un Programa nuevo (código: "TC2024", nombre: "Técnico en Computación")
2. Dentro del programa, crea Bloques (Bloque 1, Bloque 2, etc.)
3. Dentro de cada bloque, agrega Módulos (materias específicas)
4. Configura fechas, orden y requisitos de asistencia
```

---

## 2. Programas

### ¿Qué es?
Una vista simplificada para **gestionar solo la lista de programas** sin la jerarquía completa de bloques y módulos.

### Diferencia con Estructura Académica
- **Estructura Académica**: Editor completo jerárquico (Programas + Bloques + Módulos)
- **Programas**: Vista de tabla simple, solo para administrar programas

### Funcionalidad del Frontend

**Archivo:** `/frontend/src/pages/Programas.tsx` (236 líneas)

**Características:**
1. **Tabla paginada** con todos los programas
2. **Formulario inline** para crear/editar programas
3. **Filtros y búsqueda**
4. **Links** a la vista detallada de cada programa
5. **Estado activo/inactivo** configurable

**Casos de uso:**
- Ver rápidamente todos los programas disponibles
- Activar/desactivar programas
- Editar información básica sin navegar la estructura completa

---

## 3. Calendario Académico

### ¿Qué es?
Define **bloques de tiempo** que establecen el calendario de cursada (fechas de clases, exámenes, recesos, etc.)

### Concepto clave: Bloque de Fechas
Un "Bloque de Fechas" es una plantilla de calendario que define:
- **Fecha de inicio** del período académico
- **Secuencia de semanas** con tipos específicos

### Tipos de Semanas
El sistema define diferentes tipos de semanas:
- `CLASE`: Semana normal de clases
- `EXAMEN`: Semana de exámenes
- `RECESO`: Semana de vacaciones/receso
- `PRACTICA`: Semana intensiva de prácticas

### Estructura de Datos

**Modelo BloqueDeFechas:**
```python
- id
- nombre           # Ej: "Calendario 2024 - Cuatrimestre 1"
- fecha_inicio     # Fecha de inicio (Ej: 2024-03-01)
- semanas_config   # Relación con SemanaConfig
```

**Modelo SemanaConfig:**
```python
- id
- bloque           # Referencia al BloqueDeFechas
- orden            # Número de semana (1, 2, 3, ...)
- tipo             # CLASE, EXAMEN, RECESO, PRACTICA
```

### Endpoints del Backend

**Archivo:** `/backend/core/api/bloques_fechas.py`

```
GET    /api/bloques-de-fechas                        → Lista todos los calendarios
GET    /api/bloques-de-fechas/{id}                   → Detalle de un calendario
POST   /api/bloques-de-fechas                        → Crear nuevo calendario
PUT    /api/bloques-de-fechas/{id}                   → Actualizar calendario
DELETE /api/bloques-de-fechas/{id}                   → Eliminar calendario
POST   /api/bloques-de-fechas/{id}/guardar_secuencia → Guardar secuencia de semanas
```

### Funcionalidad del Frontend

**Archivo:** `/frontend/src/pages/Calendario.jsx` (137 líneas)

**Características:**
1. **Lista de calendarios** con información básica
2. **Gestión de secuencia de semanas** mediante diálogo modal
3. **Editor visual** para definir el tipo de cada semana
4. **Vista cronológica** de las semanas configuradas

**Componentes relacionados:**
- `BloqueFormDialog.jsx`: Formulario para crear/editar bloques de fechas
- `SecuenciaFormDialog.jsx`: Editor de secuencia de semanas

**Ejemplo práctico:**
```
Calendario: "Cuatrimestre 1 - 2024"
Fecha inicio: 2024-03-04

Secuencia:
  Semana 1: CLASE
  Semana 2: CLASE
  Semana 3: CLASE
  Semana 4: EXAMEN
  Semana 5: RECESO
  Semana 6: CLASE
  ...
```

---

## 4. Cohortes

### ¿Qué es?
Una **Cohorte** es una cursada específica que vincula:
- Un **Programa** (qué se enseña)
- Un **Calendario** (cuándo se enseña)

### Concepto
Piensa en una cohorte como "una comisión" o "un grupo de estudiantes que cursan juntos". Por ejemplo:
- Cohorte: "Técnico en Informática - Marzo 2024"
- Programa: Técnico en Informática
- Calendario: Cuatrimestre 1 - 2024

### Estructura de Datos

**Modelo Cohorte:**
```python
- id
- nombre              # Ej: "TI-2024-A"
- programa_id         # Referencia al Programa
- bloque_fechas_id    # Referencia al Calendario (BloqueDeFechas)
```

### Endpoints del Backend

```
GET    /api/inscripciones/cohortes?programa_id={id}  → Lista cohortes (filtradas)
POST   /api/inscripciones/cohortes                   → Crear nueva cohorte
```

**Nota:** Los endpoints de cohortes están en el router de inscripciones porque las cohortes están fuertemente vinculadas con las inscripciones de estudiantes.

### Funcionalidad del Frontend

**Archivo:** `/frontend/src/pages/Cohortes.jsx` (138 líneas)

**Características:**
1. **Tabla con todas las cohortes**
2. **Muestra:** Nombre de cohorte, Programa asociado, Calendario asociado
3. **Paginación** para manejar muchas cohortes
4. **Formulario de creación** mediante diálogo modal

**Componente relacionado:**
- `CohorteFormDialog.jsx`: Formulario para crear nuevas cohortes

**Flujo de trabajo:**
```
1. Seleccionar un Programa existente (Ej: "Técnico en Redes")
2. Seleccionar un Calendario existente (Ej: "Calendario 2024-1")
3. Asignar nombre a la cohorte (Ej: "Redes-2024-Mañana")
4. Guardar → La cohorte queda lista para inscribir estudiantes
```

---

## 5. Gráfico de Cursos

### ¿Qué es?
Una **visualización en árbol** de la estructura completa de un programa, mostrando:
- Bloques (Baterías)
- Módulos dentro de cada bloque
- Exámenes finales asociados

### Propósito
Permite ver de forma clara y organizada toda la estructura curricular de un programa, opcionalmente filtrada por una cohorte específica.

### Endpoint del Backend

**Archivo:** `/backend/core/api/analytics.py` (líneas 350-411)

```
GET /api/analytics/courses-graph?programa_id={id}&cohorte_id={id}
```

**Lógica del endpoint:**
1. Obtiene el programa solicitado
2. Consulta todos los bloques del programa (ordenados por `orden`)
3. Para cada bloque:
   - Lista todos sus módulos (ordenados por `orden`)
   - Lista los exámenes finales del bloque
4. Si se proporciona `cohorte_id`, incluye información de la cohorte
5. Devuelve un árbol JSON estructurado

**Estructura de respuesta:**
```json
{
  "programa": {
    "id": 1,
    "codigo": "TI-2024",
    "nombre": "Técnico en Informática"
  },
  "cohorte": {
    "id": 5,
    "nombre": "TI-2024-A",
    "programa_id": 1,
    "bloque_fechas_id": 3,
    "bloque_fechas_nombre": "Calendario 2024-1"
  },
  "tree": [
    {
      "type": "bloque",
      "id": 10,
      "nombre": "Fundamentos de Programación",
      "orden": 1,
      "children": [
        {
          "type": "modulo",
          "id": 45,
          "nombre": "Introducción a Python",
          "orden": 1,
          "es_practica": false,
          "fecha_inicio": "2024-03-04",
          "fecha_fin": "2024-04-15"
        }
      ],
      "finales": [
        {
          "id": 100,
          "tipo_examen": "FINAL_VIRTUAL",
          "fecha": "2024-04-20",
          "peso": 70.0
        }
      ]
    }
  ]
}
```

### Funcionalidad del Frontend

**Archivo:** `/frontend/src/pages/GraficoCursos.jsx` (166 líneas)

**Características:**
1. **Selectores de filtro:**
   - Programa (obligatorio)
   - Cohorte (opcional)
2. **Vista de acordeones anidados** (3 niveles):
   - Nivel 1: Bloques/Baterías
   - Nivel 2: Módulos
   - Nivel 3: Información de exámenes finales
3. **Muestra información detallada:**
   - Orden de cada elemento
   - Fechas de inicio/fin de módulos
   - Si el módulo es práctica
   - Exámenes finales del bloque

**Casos de uso:**
- Revisar la estructura completa de un programa antes de lanzarlo
- Ver qué módulos y exámenes tiene asignada una cohorte específica
- Planificación académica y logística

---

## Arquitectura Técnica

### Backend (Django + Django Ninja)

**Framework:** Django con Django Ninja (API REST moderna)

**Organización:**
```
backend/
├── core/
│   ├── models.py              # Modelos de base de datos
│   ├── serializers.py         # Serializadores DRF
│   └── api/
│       ├── programas.py       # Endpoints de programas
│       ├── bloques.py         # Endpoints de bloques
│       ├── modulos.py         # Endpoints de módulos
│       ├── bloques_fechas.py  # Endpoints de calendarios
│       ├── estructura.py      # Endpoint de estructura
│       └── analytics.py       # Analytics y gráfico de cursos
└── academia/
    └── api.py                 # Registro de routers
```

**Autenticación:**
- JWT (JSON Web Tokens)
- Decorator `@require_authenticated_group` en todos los endpoints administrativos

**Base de datos:**
- PostgreSQL
- Relaciones:
  - Programa ←→ Bloques (1:N)
  - Bloque ←→ Módulos (1:N)
  - Bloque ←→ Correlativas (N:N - self-referencing)
  - BloqueDeFechas ←→ SemanaConfig (1:N)
  - Cohorte → Programa (N:1)
  - Cohorte → BloqueDeFechas (N:1)

### Frontend (React + Material-UI)

**Framework:** React con TypeScript/JavaScript

**Organización:**
```
frontend/src/
├── pages/
│   ├── Estructura.jsx         # Editor de estructura completa
│   ├── Programas.tsx          # Vista de tabla de programas
│   ├── Calendario.jsx         # Gestión de calendarios
│   ├── Cohortes.jsx           # Gestión de cohortes
│   └── GraficoCursos.jsx      # Visualización de árbol
├── components/
│   ├── BloqueFormDialog.jsx   # Formulario de bloques de fechas
│   ├── SecuenciaFormDialog.jsx # Editor de secuencia de semanas
│   └── CohorteFormDialog.jsx  # Formulario de cohortes
├── api/
│   ├── client.js              # Cliente Axios configurado
│   └── hooks.ts               # React Query hooks
└── services/
    ├── programasService.js
    └── estructuraService.js
```

**Librerías principales:**
- **Material-UI (MUI)**: Componentes de interfaz
- **React Query**: Gestión de estado del servidor
- **Axios**: Peticiones HTTP
- **React Router**: Navegación

### Flujo de Datos

**Ejemplo: Crear un módulo nuevo**

```
┌─────────────┐
│  Frontend   │
│ (Estructura │
│    .jsx)    │
└──────┬──────┘
       │ 1. Usuario completa formulario
       │    y hace clic en "Añadir"
       ▼
┌──────────────────┐
│ handleSaveModulo │
│   (Validación)   │
└────────┬─────────┘
         │ 2. POST /api/modulos
         │    payload: { nombre, bloque_id, orden, ... }
         ▼
┌─────────────────┐
│   Backend API   │
│  modulos.py     │
└────────┬────────┘
         │ 3. Validación con serializer
         │    ModuloSerializer
         ▼
┌─────────────────┐
│   PostgreSQL    │
│  Crear registro │
└────────┬────────┘
         │ 4. Retorna objeto creado
         ▼
┌─────────────────┐
│    Frontend     │
│ Actualiza vista │
│ Muestra feedback│
└─────────────────┘
```

### Permisos y Seguridad

**Sistema de autenticación:**
1. Login genera un token JWT
2. Token se almacena en `localStorage`
3. Cliente Axios incluye el token en header `Authorization`
4. Backend valida el token en cada request

**Decorador de permisos:**
```python
@require_authenticated_group
def crear_programa(request, payload: ProgramaIn):
    # Solo usuarios autenticados pueden acceder
    ...
```

---

## Flujo de Trabajo Completo

### Escenario: Lanzar un nuevo programa académico

**Paso 1: Diseñar Estructura Académica**
1. Ir a **Estructura Académica**
2. Crear nuevo **Programa**: "Técnico en Desarrollo Web 2024"
3. Dentro del programa, crear **Bloques**:
   - Bloque 1: Fundamentos Web
   - Bloque 2: Frontend Avanzado
   - Bloque 3: Backend y Bases de Datos
4. Dentro de cada bloque, agregar **Módulos**:
   - Bloque 1 → HTML & CSS, JavaScript Básico
   - Bloque 2 → React, Vue.js
   - Bloque 3 → Node.js, MongoDB

**Paso 2: Configurar Calendario**
1. Ir a **Calendario Académico**
2. Crear nuevo **Bloque de Fechas**: "Calendario 2024 - Semestre 1"
3. Fecha inicio: 01/03/2024
4. Configurar secuencia de semanas:
   - Semanas 1-4: CLASE
   - Semana 5: EXAMEN
   - Semana 6: RECESO
   - (etc.)

**Paso 3: Crear Cohorte**
1. Ir a **Cohortes**
2. Crear nueva cohorte:
   - Nombre: "TDW-2024-Mañana"
   - Programa: "Técnico en Desarrollo Web 2024"
   - Calendario: "Calendario 2024 - Semestre 1"

**Paso 4: Verificar en Gráfico de Cursos**
1. Ir a **Gráfico de Cursos**
2. Seleccionar programa "Técnico en Desarrollo Web 2024"
3. Seleccionar cohorte "TDW-2024-Mañana"
4. Revisar la estructura completa en vista de árbol

**Paso 5: Abrir inscripciones**
- Ahora los estudiantes pueden inscribirse a la cohorte "TDW-2024-Mañana"
- El sistema ya sabe qué módulos cursarán y cuándo

---

## Resumen de Relaciones

```
PROGRAMA
  ├── Define: Carrera o curso completo
  ├── Contiene: Múltiples bloques
  └── Se asocia con: Cohortes

BLOQUE
  ├── Define: Sección de un programa
  ├── Pertenece a: Un programa
  ├── Contiene: Múltiples módulos
  └── Puede tener: Correlativas (otros bloques)

MÓDULO
  ├── Define: Materia individual
  ├── Pertenece a: Un bloque
  └── Puede tener: Exámenes asociados

CALENDARIO (BloqueDeFechas)
  ├── Define: Cronograma de cursada
  ├── Contiene: Secuencia de semanas (SemanaConfig)
  └── Se asocia con: Cohortes

COHORTE
  ├── Define: Cursada específica
  ├── Vincula: Un programa + Un calendario
  └── Tiene: Estudiantes inscritos

GRÁFICO DE CURSOS
  └── Visualiza: Todo lo anterior en forma de árbol
```

---

## Conclusión

La sección de **Administración** del CFP es un sistema completo de gestión académica que permite:

1. ✅ Diseñar estructuras curriculares flexibles
2. ✅ Configurar calendarios académicos personalizados
3. ✅ Crear cohortes vinculando programas y calendarios
4. ✅ Visualizar toda la información de forma clara
5. ✅ Gestionar todo desde una interfaz web intuitiva

**Ventajas del sistema:**
- **Modular**: Cada componente tiene responsabilidad única
- **Escalable**: Soporta múltiples programas y cohortes simultáneas
- **Flexible**: Permite calendarios y estructuras personalizadas
- **Completo**: CRUD completo en todos los niveles
- **Seguro**: Autenticación JWT en todos los endpoints

Este sistema proporciona las bases para la gestión completa de un centro de formación profesional, desde la planificación curricular hasta la ejecución de cursadas con estudiantes reales.
