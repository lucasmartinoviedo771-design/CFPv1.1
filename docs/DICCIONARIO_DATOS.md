# Diccionario de Datos — CFP (Centro de Formación Profesional)

**Base de datos:** `CFP` (MySQL, 8.0, Puerto 3306 [interno] / 3308 [host])
**Backend / ORM:** Django ORM — Python
**Entorno:** producción
**Última actualización:** 2026-05-26
**Autor/Responsable:** Lucasmartinoviedo771-design / CFP Development Team
**Versión del documento:** v1.0

---

## Índice de Módulos

1. [Estructura Académica](#1-estructura-académica)
2. [Ciclos Académicos y Cursada](#2-ciclos-académicos-y-cursada)
3. [Gestión de Estudiantes e Inscripciones](#3-gestión-de-estudiantes-e-inscripciones)
4. [Evaluación y Calificaciones](#4-evaluación-y-calificaciones)
5. [Preinscripciones y Admisión Terciaria](#5-preinscripciones-y-admisión-terciaria)
6. [Usuarios y Seguridad (Autenticación)](#6-usuarios-y-seguridad-autenticación)
7. [Tablas del Framework (Django)](#7-tablas-del-framework-django)

---

## Convenciones

| Símbolo  | Significado                              |
|----------|------------------------------------------|
| PK       | Clave primaria                           |
| FK       | Clave foránea                            |
| UQ       | Valor único                              |
| NN       | Not Null (obligatorio)                   |
| IDX      | Columna indexada                         |
| PII      | Dato personal identificable (privacidad) |
| SNAP     | Snapshot — copia desnormalizada del valor en el momento del registro |
| DEP      | Deprecado — columna o tabla en proceso de eliminación |
| DEF      | Tiene valor por defecto definido         |
| ENC      | Valor almacenado encriptado o hasheado   |

---

## Módulos y Tablas

### 1. Estructura Académica

Este módulo define los cimientos del diseño curricular del Centro de Formación Profesional: marcos legales (resoluciones), los programas de capacitación asociados, sus subdivisiones pedagógicas en bloques y módulos, así como las plantillas de calendario académicas utilizadas para su organización temporal.

#### `core_resolucion`

Marco legal oficial que autoriza y valida la oferta de trayectos formativos y capacitaciones dictadas en la institución. Ejemplo: Resolución 3601/2023.

> **Regla de integridad:** No se puede eliminar físicamente una resolución del sistema si posee programas académicos vinculados (`on_delete=models.PROTECT` en la tabla `core_programa`).

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Identificador autoincremental de la resolución. |
| `numero` | varchar(50) | UQ, NN | — | Número de resolución identificador oficial (ej. `3601/2023`). |
| `nombre` | varchar(200) | NN | — | Denominación descriptiva de la resolución. |
| `fecha_publicacion` | date | NN | — | Fecha de publicación oficial de la normativa. |
| `vigente` | tinyint(1) | NN | DEF | Indica si la resolución sigue vigente para el año lectivo. Default: `True` (1). |
| `observaciones` | longtext | NN | DEF | Notas o aclaraciones adicionales sobre la resolución. Default: `""` (vacío). |
| `created_at` | datetime | NN | — | Fecha y hora de creación del registro. |
| `updated_at` | datetime | NN | — | Fecha y hora de la última modificación del registro. |

**Restricciones únicas:** `(numero)` — no pueden existir dos resoluciones con el mismo identificador numérico.

**Índices:** `(fecha_publicacion)` — ordenación por fecha oficial descendente.

**Política de borrado:** Restringida / Protegida.

**Estimación de volumen:** Baja (< 1K filas).

---

#### `core_programa`

Representa una propuesta curricular, capacitación o curso ofrecido por la institución. Asocia un trayecto educativo con una resolución específica.

> **Lógica de negocio:** Si `requiere_titulo_secundario` es `True`, el sistema obligará a los aspirantes a adjuntar su certificado analítico durante el proceso de inscripción y validación de documentación digital.

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Identificador interno autoincremental. |
| `resolucion_id` | bigint | FK → `core_resolucion.id`, NULL | — | Referencia al marco legal que habilita la enseñanza de este programa. |
| `codigo` | varchar(30) | UQ, NN | — | Sigla o código único identificador del programa (ej. `HD`, `CDIA`). |
| `nombre` | varchar(200) | NN | — | Nombre completo descriptivo de la capacitación o curso. |
| `activo` | tinyint(1) | NN | DEF | Indica si la capacitación sigue habilitada para dictarse. Default: `True` (1). |
| `requiere_titulo_secundario` | tinyint(1) | NN | DEF | Si el programa requiere adjuntar obligatoriamente título secundario. Default: `False` (0). |
| `created_at` | datetime | NN | — | Fecha y hora de creación del registro. |
| `updated_at` | datetime | NN | — | Fecha y hora de la última modificación del registro. |

**Restricciones únicas:** `(codigo)` — cada programa tiene una sigla única en el sistema.

**Política de borrado:** Cascade (elimina cohortes y bloques vinculados) / Protegida en cascada superior.

**Estimación de volumen:** Baja (< 1K filas).

---

#### `core_bloque`

Módulo curricular de nivel superior dentro de un `core_programa`. Agrupa un conjunto de asignaturas o temas específicos y gestiona las dependencias formativas (correlativas).

> **Regla de integridad:** Mantiene una relación recursiva muchos a muchos (`symmetrical=False`) que modela el árbol de correlativas indispensables para habilitar al estudiante a cursar el bloque actual.

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Identificador autoincremental. |
| `programa_id` | bigint | FK → `core_programa.id`, NN | — | Programa académico al que pertenece este bloque curricular. |
| `nombre` | varchar(120) | NN | — | Nombre del bloque temático (ej. `Bases de Datos`). |
| `created_at` | datetime | NN | — | Fecha y hora de creación del registro. |
| `updated_at` | datetime | NN | — | Fecha y hora de la última modificación del registro. |

**Restricciones únicas:** `(programa_id, nombre)` — un mismo programa no puede poseer dos bloques con idéntica denominación.

**Relaciones M2M:** `core_bloque_correlativas` → vincula recursivamente con `core_bloque` (campos `from_bloque_id` y `to_bloque_id`).

> **Regla de integridad (Correlativas circulares):** Señal `m2m_changed` (`validate_bloque_correlativas`) que implementa un algoritmo BFS para detectar e impedir la creación de correlatividades circulares directas o indirectas entre bloques (soluciona M6).

**Política de borrado:** Cascade (al borrar el programa, se eliminan sus bloques).

**Estimación de volumen:** Baja (< 1K filas).

---

#### `core_modulo`

Subdivisiones didácticas específicas contenidas dentro de un `core_bloque`. Constituyen las unidades de dictado y evaluación independientes del plan formativo.

> **Lógica de negocio:** Si `es_practica = True`, el sistema aplica validaciones estrictas y exige que el porcentaje de asistencia registrado del alumno sea igual o superior a `asistencia_requerida_practica` para aprobar.
> **Regla de integridad (Coherencia temporal):** La fecha de finalización (`fecha_fin`) debe ser estrictamente posterior o igual a la fecha de inicio (`fecha_inicio`), siendo validada de manera obligatoria en cada guardado (`save()`) del modelo (soluciona L1).

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Identificador interno autoincremental. |
| `bloque_id` | bigint | FK → `core_bloque.id`, NN | — | Bloque superior al que se circunscribe este módulo. |
| `nombre` | varchar(120) | NN | — | Denominación del módulo didáctico (ej. `Módulo I: Introducción al Análisis de Datos`). |
| `fecha_inicio` | date | NULL | — | Fecha real o planificada de inicio del dictado presencial/virtual. |
| `fecha_fin` | date | NULL | — | Fecha real o planificada de finalización del dictado. |
| `es_practica` | tinyint(1) | NN | DEF | Identifica si corresponde a talleres prácticos/profesionalizantes. Default: `False` (0). |
| `asistencia_requerida_practica` | int unsigned | NN | DEF | Porcentaje mínimo exigido de asistencia en módulos prácticos. Default: `80` (%). |
| `created_at` | datetime | NN | — | Fecha y hora de creación del registro. |
| `updated_at` | datetime | NN | — | Fecha y hora de la última modificación del registro. |

**Restricciones únicas:** `(bloque_id, nombre)` — cada bloque debe poseer nombres de módulo unívocos.

**Política de borrado:** Cascade (al eliminar un bloque se eliminan sus módulos en cascada).

**Estimación de volumen:** Baja (< 1K filas).

---

#### `core_bloquedefechas`

Plantilla de calendario genérica y parametrizable (sin fechas anuales fijas). Permite definir una secuencia organizada de semanas académicas y sus tipos de actividades, reutilizable entre múltiples cohortes.

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Identificador autoincremental. |
| `nombre` | varchar(150) | UQ, NN | — | Nombre descriptivo único de la secuencia (ej. `Estándar 8 semanas`). |
| `descripcion` | longtext | NN | DEF | Notas complementarias explicativas de la estructura del calendario. Default: `""` (vacío). |
| `created_at` | datetime | NN | — | Fecha y hora de creación del registro. |
| `updated_at` | datetime | NN | — | Fecha y hora de la última modificación del registro. |

**Restricciones únicas:** `(nombre)` — cada plantilla de calendario académico posee un nombre único.

**Política de borrado:** Protegida/Restringida por FKs descendentes.

**Estimación de volumen:** Baja (< 1K filas).

---

#### `core_semanaconfig`

Configuración y actividades programadas para cada semana individual contemplada en la plantilla de calendario `core_bloquedefechas`.

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Identificador autoincremental de la semana. |
| `bloque_id` | bigint | FK → `core_bloquedefechas.id`, NN | — | Plantilla de calendario a la cual pertenece esta semana estructurada. |
| `tipo` | varchar(20) | NN | — | Tipología de la semana formativa: `CLASE`=Clase · `PARCIAL`=Parcial · `FINAL_VIRTUAL`=Final Virtual · `FINAL_SINC`=Final Sincrónico · `SIN_ACTIVIDADES`=Sin Actividades. |
| `orden` | int unsigned | NN | — | Posición secuencial cronológica de la semana dentro de la plantilla (1, 2, 3...). |
| `created_at` | datetime | NN | — | Fecha y hora de creación del registro. |
| `updated_at` | datetime | NN | — | Fecha y hora de la última modificación del registro. |

**Restricciones únicas:** `(bloque_id, orden)` — una plantilla no admite dos configuraciones para la misma posición de orden semanal.

**Índices:** `(bloque_id, orden)` — ordenamiento por plantilla e índice semanal.

**Política de borrado:** Cascade (si se borra la plantilla, se eliminan sus semanas configuradas).

**Estimación de volumen:** Baja (< 1K filas).

---

### 2. Ciclos Académicos y Cursada

Este módulo controla la ejecución temporal de los programas formativos (cohortes), el planeamiento de horarios semanales de dictado, la asignación de docentes a cargo de las aulas y el seguimiento diario de la asistencia del alumnado.

#### `core_cohorte`

Representa una cohorte o ciclo lectivo específico para el dictado de un `core_programa` con fechas de inicio reales y una plantilla de calendario concreta.

> **Señal automática:** Al guardarse un registro en esta tabla, el receptor `create_exams_from_template` en `signals.py` analiza la plantilla `bloque_fechas`. Si encuentra semanas con exámenes (`PARCIAL`, `FINAL_VIRTUAL` o `FINAL_SINC`), genera de forma automática los objetos `core_examen` asociados a este bloque o sus módulos respectivos, junto con el de tipo `EQUIVALENCIA` (se ejecuta únicamente en la creación de la cohorte, soluciona M7).

> **Regla de integridad (Coherencia temporal):** La fecha de finalización (`fecha_fin`) debe ser estrictamente posterior o igual a la fecha de inicio (`fecha_inicio`), siendo validada de manera obligatoria en cada guardado (`save()`) del modelo (soluciona L1).

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Identificador autoincremental. |
| `programa_id` | bigint | FK → `core_programa.id`, NN | — | Programa académico del que se abre esta instancia. |
| `bloque_id` | bigint | FK → `core_bloque.id`, NN | — | Bloque académico al que aplica la cohorte (obligatorio) (soluciona M3). |
| `bloque_fechas_id` | bigint | FK → `core_bloquedefechas.id`, NN | — | Plantilla de calendario a implementar para la estructuración del ciclo. |
| `nombre` | varchar(100) | NN | — | Nombre identificativo del curso/comisión de la cohorte (ej. `CDIA - Comisión A 2024`). |
| `fecha_inicio` | date | NN | DEF | Fecha efectiva en que inician las clases de la cohorte. Default: `timezone.now`. |
| `fecha_fin` | date | NULL | — | Fecha estimada o confirmada de cierre del ciclo. |
| `created_at` | datetime | NN | — | Fecha y hora de registro. |
| `updated_at` | datetime | NN | — | Fecha y hora de última modificación. |

**Restricciones únicas:** `(programa_id, bloque_id, nombre)` — UniqueConstraint `uniq_cohorte_programa_bloque_nombre`.

**Política de borrado:** Cascade (si se borra el programa). Protegida con respecto al bloque e historial de fechas.

**Estimación de volumen:** Baja (< 1K filas).

---

#### `core_horariocursada`

Establece el cronograma semanal detallado (día y horas) de clases para una `core_cohorte` y asocia el docente del personal responsable a cargo de la cursada.

> **Regla de integridad:** La `hora_fin` debe ser estrictamente posterior a la `hora_inicio` (`clean`).
> **Regla de integridad:** El bloque de la cursada configurado debe corresponderse con el bloque académico de la cohorte seleccionada (`clean`).
> **Regla de integridad:** Si se especifica un módulo, este debe pertenecer jerárquicamente al bloque académico seleccionado (`clean`).
> **Regla de integridad (Duplicados con módulo NULL):** Al guardarse (`save()`), se valida de manera manual la existencia de horarios idénticos duplicados cuando `modulo_id` es NULL, superando la limitación de unicidad de MySQL con valores nulos (soluciona C6).

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Identificador único del horario. |
| `cohorte_id` | bigint | FK → `core_cohorte.id`, NN | — | Cohorte a la cual aplica el horario de clases. |
| `bloque_id` | bigint | FK → `core_bloque.id`, NN | — | Bloque académico al que pertenece el horario. |
| `modulo_id` | bigint | FK → `core_modulo.id`, NULL | — | Módulo curricular específico de la clase (opcional). |
| `docente_id` | int | FK → `auth_user.id`, NULL | — | Docente responsable asignado para dictar la clase en ese periodo. |
| `dia_semana` | varchar(10) | NN | — | Día de la semana: `LUNES`=Lunes · `MARTES`=Martes · `MIERCOLES`=Miércoles · `JUEVES`=Jueves · `VIERNES`=Viernes · `SABADO`=Sábado · `DOMINGO`=Domingo. |
| `hora_inicio` | time | NN | — | Hora de inicio del dictado de la clase. |
| `hora_fin` | time | NN | — | Hora de finalización del dictado de la clase. |
| `created_at` | datetime | NN | — | Fecha de creación del registro. |
| `updated_at` | datetime | NN | — | Fecha de última modificación. |

**Restricciones únicas:** `(cohorte_id, bloque_id, modulo_id, dia_semana, hora_inicio, hora_fin)` — UniqueConstraint `uniq_horario_cursada`.

**Índices:**
- `(cohorte_id, dia_semana)`
- `(bloque_id, modulo_id)`
- `(docente_id, cohorte_id)`

**Política de borrado:** Cascade (para cohorte, bloque, módulo). SET_NULL en caso de eliminación del docente (`auth_user`).

**Estimación de volumen:** Media (1K–100K filas).

---

#### `core_asistencia`

Tabla transaccional que almacena de forma masiva e individual el parte de asistencia diario de cada alumno para cada módulo formativo cursado.

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Identificador único autoincremental de la asistencia. |
| `estudiante_id` | bigint | FK → `core_estudiante.id`, NN, IDX | — | Alumno evaluado en el parte de asistencia. |
| `modulo_id` | bigint | FK → `core_modulo.id`, NN, IDX | — | Módulo en el cual se registra la asistencia. |
| `fecha` | date | NN, IDX | — | Fecha del dictado de clases presencial/virtual. |
| `presente` | tinyint(1) | NN | DEF | Flag que indica si el estudiante estuvo presente (`1`) o ausente (`0`). Default: `False` (0). |
| `archivo_origen` | varchar(200) | NN | DEF | Nombre del archivo de importación origen si el lote fue cargado masivamente. Default: `""` (vacío). |
| `created_at` | datetime | NN | — | Fecha de registro en el sistema. |
| `updated_at` | datetime | NN | — | Fecha de última modificación. |

**Restricciones únicas:** `(estudiante_id, modulo_id, fecha)` — un estudiante solo puede tener un registro de presencia o ausencia al día por módulo.

**Índices:**
- `(modulo_id, fecha)`
- `(estudiante_id, modulo_id)`

**Política de borrado:** Cascade (se elimina al borrar el estudiante o el módulo asociado).

**Estimación de volumen:** Alta (> 100K filas en producción).

---

### 3. Gestión de Estudiantes e Inscripciones

Mapea toda la información personal, documentación de respaldo, estatus académico y las inscripciones específicas a los diferentes trayectos académicos que completan los estudiantes del CFP.

#### `core_estudiante`

Contiene el perfil personal completo, datos filiatorios, de contacto, sociodemográficos, archivos adjuntos de legajo digitalizado y el estado de regularidad general del alumno.

> **Regla de validación (ORM):** El teléfono declarado debe pasar la validación `validate_telefono`, forzando a que contenga exactamente 10 caracteres numéricos (código de área sin 0 ni 15 + número de abonado).
> **Señal automática:** Al cambiar su `estatus` a `Regular`, la señal `activate_inscripciones_on_regular` actualiza automáticamente de `PREINSCRIPTO` a `CURSANDO` todas sus inscripciones vinculadas.
> **Señal automática:** Al realizarse el borrado físico de un estudiante, la señal `delete_estudiante_files` en `signals.py` se dispara y borra físicamente todos los archivos adjuntos almacenados en el disco del servidor (`dni_digitalizado`, `titulo_secundario_digitalizado`, `dni_tutor_digitalizado`, `nota_parental_firmada`).

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Identificador interno único. |
| `email` | varchar(254) | UQ, NN, IDX | PII | Correo electrónico de contacto principal. |
| `apellido` | varchar(120) | NN, IDX | PII | Apellidos del estudiante. |
| `nombre` | varchar(120) | NN, IDX | PII | Nombres del estudiante. |
| `dni` | varchar(20) | UQ, NN | PII | Documento Nacional de Identidad o equivalente. |
| `cuit` | varchar(20) | NN | PII, DEF | CUIT del estudiante. Default: `""` (vacío). |
| `sexo` | varchar(1) | NN | PII, DEF | Identidad biológica declarada: `M`=Masculino · `F`=Femenino · `O`=Otro. Default: `""` (vacío) (soluciona M2). |
| `fecha_nacimiento` | date | NULL | PII | Fecha de nacimiento del estudiante. |
| `pais_nacimiento` | varchar(60) | NN | DEF | País de nacimiento: `Argentina` · `Bolivia` · `Brasil` · `Chile` · `Paraguay` · `Uruguay` · `Otro`. Default: `""` (vacío). |
| `pais_nacimiento_otro` | varchar(120) | NN | DEF | Especificación del país si eligió 'Otro'. Default: `""` (vacío). |
| `nacionalidad` | varchar(60) | NN | DEF | Nacionalidad registrada. Default: `""` (vacío). |
| `nacionalidad_otra` | varchar(120) | NN | DEF | Especificación si su nacionalidad es otra. Default: `""` (vacío). |
| `lugar_nacimiento` | varchar(120) | NN | DEF | Lugar de nacimiento (Provincia). Default: `""` (vacío). |
| `domicilio` | varchar(200) | NN | PII, DEF | Dirección particular del alumno. Default: `""` (vacío). |
| `barrio` | varchar(120) | NN | DEF | Barrio del domicilio. Default: `""` (vacío). |
| `ciudad` | varchar(120) | NN, IDX | PII, DEF | Ciudad de residencia. Default: `""` (vacío). |
| `telefono` | varchar(10) | NN | PII, DEF | Teléfono celular/particular (10 dígitos). Default: `""` (vacío). |
| `nivel_educativo` | varchar(60) | NN | DEF | Nivel educativo máximo formal alcanzado. Default: `""` (vacío). |
| `estatus` | varchar(15) | NN, IDX | DEF | Estatus académico en el centro: `Regular` · `Baja` · `Condicional` · `Preinscripto`. Default: `Preinscripto` (soluciona C5). |
| `posee_pc` | tinyint(1) | NN | DEF | Indica si el alumno cuenta con PC en su domicilio. Default: `False` (0). |
| `posee_conectividad` | tinyint(1) | NN | DEF | Indica si tiene conexión a internet. Default: `False` (0). |
| `puede_traer_pc` | tinyint(1) | NN | DEF | Indica si puede llevar su laptop a las clases presenciales. Default: `False` (0). |
| `trabaja` | tinyint(1) | NN | DEF | Indica si realiza alguna actividad laboral. Default: `False` (0). |
| `lugar_trabajo` | varchar(120) | NN | DEF | Nombre del comercio/empresa donde labora. Default: `""` (vacío). |
| `dni_digitalizado` | varchar(100) | NN | DEF | Ruta al archivo adjunto del DNI digitalizado. Default: `""` (vacío). |
| `titulo_secundario_digitalizado` | varchar(100) | NN | DEF | Ruta al archivo adjunto del título secundario. Default: `""` (vacío). |
| `tutor_nombre` | varchar(200) | NN | PII, DEF | Nombre completo del tutor legal (menores de 18). Default: `""` (vacío). |
| `tutor_dni` | varchar(20) | NN | PII, DEF | Documento de identidad del tutor legal. Default: `""` (vacío). |
| `tutor_telefono` | varchar(15) | NN | PII, DEF | Teléfono de contacto del tutor legal. Default: `""` (vacío). |
| `dni_tutor_digitalizado` | varchar(100) | NN | DEF | Ruta al archivo digitalizado del DNI del tutor. Default: `""` (vacío). |
| `nota_parental_firmada` | varchar(100) | NN | DEF | Ruta al archivo de autorización de padres firmado. Default: `""` (vacío). |
| `is_active` | tinyint(1) | NN, IDX | DEF | Control de borrado lógico (Soft-delete). Default: `True` (1). |
| `archived_at` | datetime | NULL | — | Instante en que se archivó de forma lógica al estudiante. |
| `autorizacion_status` | varchar(20) | NN | DEF | Estatus de firma de legajo: `PENDIENTE` · `DIGITAL` (Selfie) · `MANUAL` (Papel). Default: `PENDIENTE`. |
| `autorizacion_token` | varchar(100) | UQ, NULL | ENC | Token de validación digital único para firma de conformidad. |
| `autorizacion_selfie` | varchar(100) | NULL | PII | Ruta a la fotografía (selfie) adjunta que valida su conformidad digital. |
| `autorizacion_fecha` | datetime | NULL | — | Fecha y hora en que completó digitalmente la firma de legajo. |
| `created_at` | datetime | NN | — | Fecha de creación del registro. |
| `updated_at` | datetime | NN | — | Fecha de última modificación. |

**Restricciones únicas:**
- `(email)` — correo electrónico único del alumno.
- `(dni)` — documento nacional único por estudiante.
- `(autorizacion_token)` — token alfanumérico único para el flujo de conformidad.

**Índices:**
- `idx_estudiante_nombre` → `(apellido, nombre)`
- `idx_estudiante_estatus` → `(estatus)`
- `idx_estudiante_active` → `(is_active)`
- `idx_estudiante_ciudad` → `(ciudad)`
- `idx_estudiante_email` → `(email)`

**Política de borrado:** Borrado lógico por defecto (`is_active` pasa a 0 y registra `archived_at`). Si se ejecuta un borrado físico, se limpian en cascada y una señal borra sus archivos.

**Estimación de volumen:** Media (1K–100K filas).

---

#### `core_inscripcion`

Vincula un `core_estudiante` con una cursada activa (`core_cohorte`), permitiendo establecer matrículas específicas para un `core_modulo`.

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Identificador autoincremental de la inscripción. |
| `estudiante_id` | bigint | FK → `core_estudiante.id`, NN | — | Estudiante adscrito a la cursada. |
| `cohorte_id` | bigint | FK → `core_cohorte.id`, NN, IDX | — | Cohorte o comisión a la que se incorpora el alumno. |
| `modulo_id` | bigint | FK → `core_modulo.id`, NULL | — | Módulo curricular asignado (para inscripciones modulares opcionales). |
| `estado` | varchar(20) | NN | DEF | Estado actual del alumno en el curso: `PREINSCRIPTO`=Preinscripto · `CURSANDO`=Cursando · `INACTIVO`=Inactivo · `LIBRE`=Libre · `PAUSADO`=Pausado · `EGRESADO`=Egresado · `APROBADO`=Aprobado · `DESAPROBADO`=Desaprobado. Default: `PREINSCRIPTO`. |
| `created_at` | datetime | NN | — | Fecha y hora en que se asienta la matrícula. |
| `updated_at` | datetime | NN | — | Fecha de última modificación. |

**Restricciones únicas:** `(estudiante_id, cohorte_id, modulo_id)` — un alumno no puede poseer dos inscripciones idénticas en el mismo ciclo y materia.

**Índices:** `(cohorte_id)` — búsquedas optimizadas de estudiantes de una cohorte.

**Política de borrado:** Cascade (al remover al estudiante o cohorte).

**Estimación de volumen:** Media (1K–100K filas).

---

#### `core_nivelaciondigital`

Registra los resultados del test de suficiencia técnica rendido de forma virtual por un estudiante, utilizado para su asignación automatizada en Habilidades Digitales Módulo 1 o 2.

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Identificador autoincremental de la nivelación. |
| `estudiante_id` | bigint | FK/OneToOne → `core_estudiante.id`, NN | — | Estudiante que completó la prueba técnica. |
| `token` | varchar(100) | UQ, NN, IDX | ENC | Token de acceso seguro único para responder el test digital. |
| `completado` | tinyint(1) | NN | DEF | Flag que indica si finalizó la nivelación. Default: `False` (0). |
| `fecha_completado` | datetime | NULL | — | Fecha y hora exactas en que terminó el test. |
| `puntaje` | int unsigned | NN | DEF | Cantidad de aciertos o calificación lograda. Default: `0`. |
| `total_preguntas` | int unsigned | NN | DEF | Cantidad total de preguntas evaluadas en el test. Default: `10`. |
| `respuestas_json` | json | NULL | — | Contenedor estructurado de las respuestas provistas por el alumno. |
| `modulo_asignado_id` | bigint | FK → `core_modulo.id`, NULL | — | Módulo final que le fue asignado al estudiante según el algoritmo de su puntaje. |
| `created_at` | datetime | NN | — | Fecha de creación del registro. |
| `updated_at` | datetime | NN | — | Fecha de última modificación. |

**Restricciones únicas:** `(estudiante_id)` — One-to-One. Cada estudiante tiene un único perfil de nivelación digital.

**Política de borrado:** Cascade (vinculada al estudiante).

**Estimación de volumen:** Media (1K–100K filas).

---

### 4. Evaluación y Calificaciones

Este módulo abarca el modelo evaluativo, incluyendo la creación programática de exámenes (parciales, finales, equivalencias) y el registro cuantitativo (notas) e intentos del alumnado.

#### `core_examen`

Entidad conceptual que planifica una instancia formal de evaluación para un `core_modulo` (ej. parciales/recuperatorios) o directamente para un `core_bloque` (ej. finales y equivalencias).

> **Regla de integridad:** Un examen no puede estar asociado al mismo tiempo a un módulo y a un bloque; debe vincularse obligatoriamente a uno de ellos (`clean`).
> **Regla de integridad:** Si está asignado a un `modulo_id`, el tipo de examen admitido debe limitarse estrictamente a `PARCIAL` o `RECUP` (`clean`).
> **Regla de integridad:** Si está asignado a un `bloque_id`, el tipo de examen admitido debe limitarse estrictamente a `FINAL_VIRTUAL`, `FINAL_SINC` o `EQUIVALENCIA` (`clean`).

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Identificador autoincremental del examen. |
| `modulo_id` | bigint | FK → `core_modulo.id`, NULL, IDX | — | Módulo curricular evaluado (para exámenes de módulo parcial/recuperatorio). |
| `bloque_id` | bigint | FK → `core_bloque.id`, NULL, IDX | — | Bloque académico evaluado (para exámenes de bloque final/equivalencia). |
| `tipo_examen` | varchar(15) | NN | — | Tipo de examen oficial: `PARCIAL`=Parcial · `RECUP`=Recuperatorio · `FINAL_VIRTUAL`=Final Virtual · `FINAL_SINC`=Final Sincrónico · `EQUIVALENCIA`=Equivalencia. |
| `fecha` | date | NULL | — | Fecha estimada o real en que se toma la evaluación. |
| `peso` | decimal(5,2) | NN | DEF | Peso específico asignado para promedios. Default: `1.00`. |
| `created_at` | datetime | NN | — | Fecha de creación del registro. |
| `updated_at` | datetime | NN | — | Fecha de última modificación. |

**Restricciones de base de datos:**
- `CheckConstraint` `check_peso_positivo` — Valida que el peso del examen sea estrictamente mayor a 0 (peso > 0) (soluciona M1).
- `UniqueConstraint` `uniq_examen_modulo_tipo` — Garantiza la existencia de a lo sumo un examen de cada tipo por módulo (por ejemplo, un solo examen `PARCIAL`), protegiendo la base de datos contra duplicaciones.
- `UniqueConstraint` `uniq_examen_bloque_tipo` — Garantiza la existencia de a lo sumo un examen de cada tipo por bloque (por ejemplo, un solo examen `FINAL_SINC`), protegiendo la base de datos contra duplicaciones.

**Índices:**
- `(modulo_id, tipo_examen)`
- `(bloque_id, tipo_examen)`

**Política de borrado:** Cascade (asociado al módulo o bloque).

**Estimación de volumen:** Baja o Media (< 1K filas).

---

#### `core_nota`

Tabla transaccional que registra la calificación numérica obtenida, el resultado de aprobación, el número de intento y equivalencias de los alumnos para un examen.

> **Regla de integridad:** Si la nota se marca como aprobada (`aprobado = True`), la calificación numérica ingresada obligatoriamente debe ser igual o superior a `6.00` (`clean`).
> **Regla de integridad:** Las homologaciones (`es_equivalencia = True`) se restringen de forma exclusiva a exámenes de tipo final de bloque (`FINAL_VIRTUAL`, `FINAL_SINC`, `EQUIVALENCIA`) (`clean`).
> **Lógica de negocio:** La relación autorreferencial `habilitado_por_id` asocia de forma lógica la aprobación de un examen Final Virtual con el derecho a rendir la instancia sincrónica correspondiente.
> **Regla de integridad (Sincronización de aprobado):** Al guardarse (`save()`), el campo `aprobado` es recalculado y sobrescrito de forma automática e incondicional basándose en `calificacion >= 6`, garantizando que ambos valores nunca puedan desincronizarse a nivel de base de datos (soluciona C3).

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Identificador único de la calificación. |
| `examen_id` | bigint | FK → `core_examen.id`, NN, IDX | — | Examen correspondiente a esta calificación. |
| `estudiante_id` | bigint | FK → `core_estudiante.id`, NN, IDX | — | Alumno evaluado en el examen. |
| `calificacion` | decimal(5,2) | NN | — | Nota numérica obtenida (ej. de 0.00 a 10.00). |
| `aprobado` | tinyint(1) | NN | DEF | Indica si el estudiante aprobó (calificación >= 6). Default: `False` (0). |
| `fecha_calificacion` | datetime | NN | — | Instante en que se asienta la nota (se autocompleta al guardar si se omite). |
| `es_equivalencia` | tinyint(1) | NN | DEF | Flag que indica si la nota se otorga por equivalencia académica externa. Default: `False` (0). |
| `origen_equivalencia` | varchar(255) | NN | DEF | Nombre de la institución educativa o programa de origen. Default: `""` (vacío). |
| `fecha_ref_equivalencia` | date | NULL | — | Fecha de referencia del trámite de homologación original. |
| `intento` | int unsigned | NN | DEF | Intento secuencial del examen realizado (1=Principal, 2=Recuperatorio, etc.). Default: `1`. |
| `es_nota_definitiva` | tinyint(1) | NN | DEF, IDX | Si esta calificación representa la nota oficial final que cierra el bloque. Default: `False` (0). |
| `habilitado_por_id` | bigint | FK → `core_nota.id`, NULL | — | Relación recursiva que asocia el examen virtual habilitante que precede a la instancia sincrónica. |
| `created_at` | datetime | NN | — | Fecha de creación del registro. |
| `updated_at` | datetime | NN | — | Fecha de última modificación. |

**Restricciones de base de datos:**
- `UniqueConstraint` `uniq_nota_examen_estudiante_intento` — Evita notas duplicadas para la misma combinación de examen, estudiante e intento (soluciona C2).
- `UniqueConstraint` `uniq_nota_definitiva_por_examen_estudiante` (parcial, donde `es_nota_definitiva = True`) — Limita a una sola calificación oficial definitiva por examen y estudiante (soluciona M4).
- `CheckConstraint` `check_calificacion_rango_valido` — Valida que la calificación se encuentre en el rango cerrado de `0.00` a `10.00` (soluciona L2).

**Índices:**
- `(examen_id, estudiante_id)`
- `(examen_id, estudiante_id, intento)`
- `(estudiante_id, es_nota_definitiva)`
- `ordering = ['-fecha_calificacion']`

**Política de borrado:** Cascade (asociada al estudiante y examen). SET_NULL en su relación recursiva si se elimina el habilitante.

**Estimación de volumen:** Alta (> 100K filas).

---

### 5. Preinscripciones y Admisión Terciaria

Gestiona el flujo completo de captación, recopilación de información personal sensible, estudios, conectividad y estado de admisión de los ingresantes a las carreras de nivel Terciario (ej. Tecnicatura en Ciencia de Datos e Inteligencia Artificial).

#### `core_preinscripcionterciario`

Almacena la ficha web de solicitud detallada y el legajo digitalizado adjunto para aspirantes terciarios del Centro Politécnico.

> **Lógica de negocio (Filtro Geográfico):** Durante el proceso de preinscripción, si el aspirante selecciona en su domicilio una localidad que se catalogue como "Otras Ciudades" (fuera de Tierra del Fuego), el sistema bloquea su registro e impide el envío, dado que la carrera se orienta de forma exclusiva a residentes provinciales.

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Identificador autoincremental de la preinscripción. |
| `email` | varchar(254) | NN | PII | Correo electrónico principal del aspirante. |
| `apellido_nombre` | varchar(200) | NN | PII | Nombres y apellidos tal cual figuran en su DNI oficial. |
| `dni` | varchar(15) | NN | PII | Documento Nacional de Identidad del aspirante. |
| `cuil` | varchar(15) | NN | PII | CUIL del aspirante. |
| `sexo` | varchar(1) | NN | — | Género: `F`=Femenino · `M`=Masculino · `O`=Otro. |
| `celular` | varchar(20) | NN | PII | Celular del aspirante. |
| `fecha_nacimiento` | date | NN | PII | Fecha de nacimiento declarada. |
| `localidad_nacimiento` | varchar(100) | NN | PII | Ciudad de nacimiento del aspirante. |
| `provincia_nacimiento` | varchar(100) | NN | — | Provincia de nacimiento del aspirante. |
| `nacionalidad` | varchar(100) | NN | — | Nacionalidad del aspirante. |
| `domicilio` | varchar(200) | NN | PII | Domicilio particular declarado en la planilla. |
| `localidad` | varchar(20) | NN | — | Localidad del domicilio: `ushuaia`=Ushuaia · `rg_sur`=Río Grande - Margen Sur · `rg_norte`=Río Grande - Margen Norte · `tolhuin`=Tolhuin · `zona_rural`=Zona rural · `otras`=Otras Ciudades. |
| `finalizo_secundaria` | varchar(10) | NN | — | Estado del secundario: `si`=Sí · `no`=No · `cursando`=Cursando el último año. |
| `posee_estudios_superiores` | tinyint(1) | NN | DEF | Si cuenta con estudios superiores previos. Default: `False` (0). |
| `estudios_superiores_finalizado` | tinyint(1) | NULL | — | Si finalizó dichos estudios superiores en caso afirmativo. |
| `estudios_superiores_carrera` | varchar(200) | NN | DEF | Carrera superior declarada previamente. Default: `""` (vacío). |
| `posee_pc` | tinyint(1) | NN | — | Si cuenta con PC en su hogar para cursar de forma virtual/híbrida. |
| `posee_internet` | tinyint(1) | NN | — | Si cuenta con conexión a internet estable en su hogar. |
| `pueblo_originario` | tinyint(1) | NN | DEF | Si se auto-reconoce perteneciente a un pueblo originario. Default: `False` (0). |
| `posee_discapacidad` | tinyint(1) | NN | DEF | Si posee alguna discapacidad diagnosticada. Default: `False` (0). |
| `tipo_discapacidad` | varchar(20) | NN | DEF | Tipo de discapacidad si aplica: `visual`=Visual · `auditiva`=Auditiva · `intelectual`=Intelectual · `motora`=Motora · `tea`=Trastornos de Espectro Autista · `otra`=Otra discapacidad · `multiple`=Más de una discapacidad. Default: `""` (vacío). |
| `posee_cud` | tinyint(1) | NULL | — | Si posee Certificado Único de Discapacidad oficial. |
| `apoyo_inclusion` | varchar(10) | NN | DEF | Apoyo del sector: `estatal`=Sector Estatal · `privado`=Sector Privado · `ninguno`=Ninguno. Default: `""` (vacío). |
| `requiere_apoyo_especifico` | tinyint(1) | NULL | — | Si requiere adecuación en el aula. |
| `descripcion_apoyo` | longtext | NN | DEF | Descripción textual detallada de los apoyos específicos que requiere. Default: `""` (vacío). |
| `dni_digitalizado` | varchar(100) | NULL | — | Ruta del archivo adjunto conteniendo la copia de su DNI. |
| `titulo_digitalizado` | varchar(100) | NULL | — | Ruta del archivo adjunto conteniendo su constancia/título de nivel medio. |
| `estado` | varchar(15) | NN | DEF | Estado administrativo de la postulación: `pendiente`=Pendiente · `aprobada`=Aprobada · `rechazada`=Rechazada. Default: `pendiente`. |
| `observaciones` | longtext | NN | DEF | Notas de los revisores académicos sobre la postulación. Default: `""` (vacío). |
| `hd_inscripcion_id` | bigint | FK → `core_inscripcion.id`, NULL | — | Referencia a una matrícula previa y aprobada de Habilidades Digitales si corresponde. |
| `created_at` | datetime | NN | — | Fecha y hora en que se ingresó la solicitud. |
| `updated_at` | datetime | NN | — | Fecha de última modificación. |

**Restricciones de base de datos:**
- `UniqueConstraint` `uniq_preinscripcion_dni` — Garantiza que no existan solicitudes duplicadas con el mismo DNI (soluciona C4).
- `UniqueConstraint` `uniq_preinscripcion_email` — Garantiza la unicidad de las solicitudes por correo electrónico de contacto (soluciona C4).

**Índices:** `ordering = ['-created_at']` (se ordenan por fecha de registro descendente).

**Política de borrado:** Hard Delete en caso de rechazo definitivo. SET_NULL en caso de eliminarse la inscripción vinculada de Habilidades Digitales.

**Estimación de volumen:** Media (1K–100K filas).

---

#### `core_configuracionpreinscripcionterciario`

Configuración global tipo Singleton (exactamente un registro con `id=1`) que regula la vigencia del portal web de preinscripción de carreras terciarias.

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Clave primaria. ID forzado a `1`. |
| `preinscripcion_abierta` | tinyint(1) | NN | DEF | Habilita o deshabilita públicamente el portal web de preinscripción. Default: `False` (0). |
| `fecha_inicio` | date | NULL | — | Fecha planificada de apertura automática del portal. |
| `fecha_fin` | date | NULL | — | Fecha planificada de cierre automático del portal. |
| `mensaje_cierre` | varchar(300) | NN | DEF | Mensaje expuesto al público cuando las preinscripciones están fuera de término. Default: `"Las preinscripciones están cerradas en este momento."`. |
| `hd_cohorte_id` | bigint | FK → `core_cohorte.id`, NULL | — | Cohorte de Habilidades Digitales Módulo 2 donde se incorpora a ingresantes con preinscripción válida. |
| `programa_terciario_id` | bigint | FK → `core_programa.id`, NULL | — | Programa terciario al que aplica esta configuración (opcional) (soluciona M5). |

**Restricciones de comportamiento:**
- **Forzar Singleton:** Se sobreescribe el método `save()` del modelo para asegurar que el registro siempre guarde `pk=1`, previniendo que existan múltiples configuraciones en la base de datos (soluciona L3).

**Política de borrado:** Ninguna (es un Singleton estático en base). SET_NULL en su relación con la cohorte destino en caso de su eliminación.

**Estimación de volumen:** Baja (Exactamente 1 registro en la base de datos).

---

### 6. Usuarios y Seguridad (Autenticación)

Este módulo gestiona la seguridad del sistema y complementa la autenticación provista por el framework, regulando claves temporales y perfiles de usuario.

#### `core_userprofile`

Perfil extendido que expande la información de la tabla de seguridad por defecto de Django (`auth_user`), controlando flujos de activación inicial y entrega de credenciales.

> **Señal automática:** Al guardarse o crearse un usuario (`auth_user`), se genera o asocia de forma inmediata un perfil a través de los receptores `create_user_profile` y `save_user_profile` de `signals.py`.

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | bigint | PK, NN, AUTO | — | Clave primaria. |
| `user_id` | int | FK/OneToOne → `auth_user.id`, NN | — | Relación directa 1-a-1 con el usuario del framework de seguridad. |
| `must_change_password` | tinyint(1) | NN | DEF | Si está activo, el usuario deberá cambiar la clave temporal obligatoriamente en su primer inicio de sesión. Default: `True` (1). |
| `temp_password` | varchar(128) | NULL | ENC | Contraseña temporal sin encriptar o en texto claro provista temporalmente para emails (se destruye tras el primer cambio exitoso). |
| `credentials_sent_at` | datetime | NULL | — | Registro de fecha y hora del envío efectivo de credenciales al correo del personal. |
| `created_at` | datetime | NN | — | Fecha y hora en que se creó el perfil. |
| `updated_at` | datetime | NN | — | Fecha y hora de última modificación. |

**Restricciones únicas:** `(user_id)` — One-to-One.

**Política de borrado:** Cascade (si se elimina el usuario, se elimina su perfil de forma automática).

**Estimación de volumen:** Baja (< 1K filas).

---

### 7. Tablas del Framework (Django)

Tablas nativas del framework que proveen servicios esenciales de autenticación y roles para el personal técnico y docente.

#### `auth_user`

Tabla nativa estándar para gestionar las cuentas y credenciales de autenticación del personal del CFP (docentes, operadores de admisión y superusuarios).

| Columna | Tipo | Restricciones | Flags | Descripción |
|---------|------|---------------|-------|-------------|
| `id` | int | PK, NN, AUTO | — | Identificador numérico del usuario. |
| `password` | varchar(128) | NN | ENC | Contraseña hasheada (cifrada con algoritmos seguros como PBKDF2/Argon2). |
| `last_login` | datetime | NULL | — | Último inicio de sesión del usuario en la plataforma. |
| `is_superuser` | tinyint(1) | NN | DEF | Flag que otorga accesos y privilegios absolutos a nivel de sistema. Default: `False` (0). |
| `username` | varchar(150) | UQ, NN | PII | Nombre de usuario alfanumérico único para acceder al panel. |
| `first_name` | varchar(150) | NN | PII, DEF | Nombres declarados del docente u operador. Default: `""`. |
| `last_name` | varchar(150) | NN | PII, DEF | Apellidos declarados del docente u operador. Default: `""`. |
| `email` | varchar(254) | NN | PII, DEF | Correo del docente u operador. Default: `""`. |
| `is_staff` | tinyint(1) | NN | DEF | Indica si tiene permitido acceder a la consola técnica administrativa. Default: `False` (0). |
| `is_active` | tinyint(1) | NN | DEF | Si está activo. Un usuario inactivo no puede iniciar sesión. Default: `True` (1). |
| `date_joined` | datetime | NN | — | Fecha y hora de registro del usuario en el sistema. |

**Restricciones únicas:** `(username)` — cada cuenta posee un nombre de usuario exclusivo.

**Estimación de volumen:** Baja (< 1K filas).

---

## Resumen de Módulos y Tablas

| Módulo | Tablas | Auditable (TimeStamped) |
|--------|--------|:---:|
| **Estructura Académica** | `core_resolucion`, `core_programa`, `core_bloque`, `core_modulo`, `core_bloquedefechas`, `core_semanaconfig` | ✓ |
| **Ciclos Académicos y Cursada** | `core_cohorte`, `core_horariocursada`, `core_asistencia` | ✓ |
| **Gestión de Estudiantes e Inscripciones** | `core_estudiante`, `core_inscripcion`, `core_nivelaciondigital` | ✓ |
| **Evaluación y Calificaciones** | `core_examen`, `core_nota` | ✓ |
| **Preinscripciones y Admisión Terciaria** | `core_preinscripcionterciario` | ✓ |
| — | `core_configuracionpreinscripcionterciario` (Singleton sin auditoría estándar) | No |
| **Usuarios y Seguridad** | `core_userprofile` (Posee campos específicos de auditoría manual) | No |
| **Tablas del Framework** | `auth_user` | No |

---

## Glosario de Enumeraciones

### Estados generales y configuraciones de Cursada

#### `core_semanaconfig` — `tipo`

| Valor | Significado |
|-------|-------------|
| `CLASE` | Semana dedicada al dictado regular de clases y contenidos formativos. |
| `PARCIAL` | Semana programada para la rendición de exámenes parciales del módulo. |
| `FINAL_VIRTUAL` | Semana asignada a la rendición del examen final en entorno virtual. |
| `FINAL_SINC` | Semana de evaluación presencial o sincrónica en línea para ratificación del examen final. |
| `SIN_ACTIVIDADES` | Semana no lectiva, feriados o recesos institucionales planificados en el calendario. |

#### `core_horariocursada` — `dia_semana`

| Valor | Significado |
|-------|-------------|
| `LUNES` | Lunes |
| `MARTES` | Martes |
| `MIERCOLES` | Miércoles |
| `JUEVES` | Jueves |
| `VIERNES` | Viernes |
| `SABADO` | Sábado |
| `DOMINGO` | Domingo |

#### `core_examen` — `tipo_examen`

| Valor | Significado |
|-------|-------------|
| `PARCIAL` | Examen parcial regular asociado al dictado curricular de un módulo específico. |
| `RECUP` | Examen recuperatorio de un parcial que el alumno desaprobó u omitió rendir. |
| `FINAL_VIRTUAL` | Evaluación final asincrónica e interactiva en plataforma digital sobre los contenidos de un bloque. |
| `FINAL_SINC` | Instancia de examen final sincrónico de ratificación práctica/teórica ante un docente. |
| `EQUIVALENCIA` | Homologación directa y oficial por estudios o trayectos previos acreditados. |

#### `core_inscripcion` — `estado`

| Valor | Significado |
|-------|-------------|
| `PREINSCRIPTO` | Solicitud recibida y en trámite de validación documental o requisitos de admisión. |
| `CURSANDO` | Matrícula activa. El estudiante asiste regularmente a clases y rinde evaluaciones en curso. |
| `INACTIVO` | Estado inactivo de cursada. El alumno no se incorporó al periodo escolar de forma efectiva. |
| `LIBRE` | Alumno que perdió la regularidad de cursada por excesos de inasistencias o desaprobación límite. |
| `PAUSADO` | Licencia estudiantil o cursada interrumpida temporalmente con autorización administrativa. |
| `EGRESADO` | El estudiante ha cursado y aprobado la totalidad de las materias del programa. |
| `APROBADO` | Cursada final del módulo/bloque calificada con aprobación formal. |
| `DESAPROBADO` | Cursada finalizada y calificada con reprobación formal en el módulo/bloque. |

---

### Filtros filiatorios y datos de origen (`core_estudiante` / `core_preinscripcionterciario`)

#### `core_estudiante` — `sexo`

| Valor | Significado |
|-------|-------------|
| `M` | Masculino |
| `F` | Femenino |
| `O` | Otro |

#### `core_estudiante` — `pais_nacimiento` / `nacionalidad`

| Valor | Significado |
|-------|-------------|
| `Argentina` | Argentina |
| `Bolivia` | Bolivia |
| `Brasil` | Brasil |
| `Chile` | Chile |
| `Paraguay` | Paraguay |
| `Uruguay` | Uruguay |
| `Otro` | Otro |

#### `core_estudiante` — `nivel_educativo`

| Valor | Significado |
|-------|-------------|
| `Primaria Completa` | Primaria Completa |
| `Secundaria Incompleta` | Secundaria Incompleta |
| `Secundaria Completa` | Secundaria Completa |
| `Terciaria/Universitaria Incompleta` | Terciaria/Universitaria Incompleta |
| `Terciaria/Universitaria Completa` | Terciaria/Universitaria Completa |
| `Terciaria/Universitaria` | Terciaria/Universitaria |

#### `core_estudiante` — `estatus`

| Valor | Significado |
|-------|-------------|
| `Regular` | Alumno regular con cursada y documentación de legajo totalmente al día. |
| `Baja` | Alumno que ha interrumpido su cursada o solicitado su baja voluntaria en el CFP. |
| `Condicional` | Alumno con cursada condicionada a la entrega final de documentación de legajo pendiente. |
| `Preinscripto` | Aspirante en trámite de matriculación inicial. |

#### `core_estudiante` — `autorizacion_status`

| Valor | Significado |
|-------|-------------|
| `PENDIENTE` | Pendiente de validación. El estudiante no ha firmado digitalmente el legajo. |
| `DIGITAL` | El legajo fue firmado digitalmente mediante conformidad biométrica (Selfie). |
| `MANUAL` | El legajo fue impreso y firmado en formato físico sobre papel en oficina. |

#### `core_preinscripcionterciario` — `sexo`

| Valor | Significado |
|-------|-------------|
| `F` | Femenino |
| `M` | Masculino |
| `O` | Otro |

#### `core_preinscripcionterciario` — `localidad`

| Valor | Significado |
|-------|-------------|
| `ushuaia` | Ushuaia |
| `rg_sur` | Río Grande - Margen Sur |
| `rg_norte` | Río Grande - Margen Norte |
| `tolhuin` | Tolhuin |
| `zona_rural` | Zona rural (Por ej. Estancia Cullen) |
| `otras` | Otras Ciudades (Filtro de exclusión automática de admisión) |

#### `core_preinscripcionterciario` — `finalizo_secundaria`

| Valor | Significado |
|-------|-------------|
| `si` | Sí, finalizó y cuenta con título analítico o certificado en trámite. |
| `no` | No finalizó los estudios de nivel medio. |
| `cursando` | Cursando el último año de nivel medio (admisión provisional). |

#### `core_preinscripcionterciario` — `tipo_discapacidad`

| Valor | Significado |
|-------|-------------|
| `visual` | Visual |
| `auditiva` | Auditiva |
| `intelectual` | Intelectual |
| `motora` | Motora |
| `tea` | Trastorno del Espectro Autista |
| `otra` | Otra discapacidad no listada |
| `multiple` | Presenta más de una discapacidad |

#### `core_preinscripcionterciario` — `apoyo_inclusion`

| Valor | Significado |
|-------|-------------|
| `estatal` | Acompañamiento e inclusión provisto por el Sector Estatal. |
| `privado` | Acompañamiento e inclusión provisto por el Sector Privado. |
| `ninguno` | No recibe apoyos externos de inclusión escolar. |

#### `core_preinscripcionterciario` — `estado`

| Valor | Significado |
|-------|-------------|
| `pendiente` | Solicitud ingresada a la espera de validación documental del personal técnico. |
| `aprobada` | Preinscripción aceptada formalmente. El ingresante califica para la matrícula activa. |
| `rechazada` | Solicitud no admitida por incumplimiento de requisitos geográficos o académicos. |

---

## Campos de Auditoría Estándar

Las tablas marcadas con ✓ en la columna "Auditable" de la tabla resumen heredan las propiedades del modelo abstracto `TimeStamped`. Estas columnas registran metadatos clave que permiten llevar a cabo análisis de modificaciones sobre el legajo estudiantil e historial de calificaciones:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `created_at` | datetime | Fecha y hora precisa en que se registró el elemento en la base de datos (se asienta mediante el parámetro automático `auto_now_add=True`). |
| `updated_at` | datetime | Fecha y hora precisa en que se registró la última modificación de cualquier atributo del elemento (se asienta mediante el parámetro automático `auto_now=True`). |

---

## Notas de Rendimiento

| Tabla | Observación |
|-------|-------------|
| `core_nota` | Crece de manera lineal y constante. Posee índices compuestos prioritarios `(examen_id, estudiante_id)`, `(examen_id, estudiante_id, intento)` y `(estudiante_id, es_nota_definitiva)` que garantizan tiempos de respuesta rápidos al consolidar promedios de aprobación de bloques académicos. |
| `core_asistencia` | Es la tabla de mayor tasa de crecimiento del sistema (inserciones masivas diarias de asistencia por alumno/módulo). Se recomienda programar un mantenimiento de índices semestral o particionamiento si se superan las 500K filas para evitar demoras al obtener reportes e indicadores KPI. |
| `core_estudiante` | Su alto volumen de consultas de búsqueda rápida en el panel administrativo está optimizado gracias a los índices `idx_estudiante_nombre`, `idx_estudiante_estatus`, `idx_estudiante_active`, `idx_estudiante_ciudad` e `idx_estudiante_email`. |

---

## Datos Sensibles y Privacidad

Las columnas marcadas con el flag `PII` (Personally Identifiable Information) del presente diccionario recopilan información confidencial sujeta a estrictos estándares de seguridad y regulaciones vigentes en materia de privacidad (como la **Ley Nacional de Protección de Datos Personales N° 25.326** de la República Argentina).

| Tabla | Columnas PII | Nivel de sensibilidad |
|-------|--------------|-----------------------|
| `core_estudiante` | `email`, `apellido`, `nombre`, `dni`, `cuit`, `sexo`, `fecha_nacimiento`, `domicilio`, `ciudad`, `telefono`, `tutor_nombre`, `tutor_dni`, `tutor_telefono`, `autorizacion_selfie` | **Alto** (Identificadores directos del ingresante, tutor, localización geográfica y fotografía biométrica) |
| `core_preinscripcionterciario` | `email`, `apellido_nombre`, `dni`, `cuil`, `celular`, `fecha_nacimiento`, `localidad_nacimiento`, `domicilio`, `tipo_discapacidad`, `descripcion_apoyo` | **Alto** (Identificadores personales, datos de salud, apoyo e inclusión escolar) |
| `auth_user` | `username`, `first_name`, `last_name`, `email`, `password` | **Medio / Alto** (Credenciales e identificación de operadores de la plataforma) |

### Definición de Niveles de Sensibilidad
- **Alto:** Identificadores gubernamentales directos (DNI, CUIT/CUIL), información de contacto unívoca (celular, email), datos de geolocalización residencial precisa, datos biométricos (selfies de conformidad digital), o datos que versen sobre salud y discapacidad (CUD, tipos de apoyo). Requieren resguardo bajo cifrado y estricta limitación de visualización técnica en consola.
- **Medio:** Nombres de usuario y credenciales operativas. Deben almacenarse encriptados bajo hash de un solo sentido irreversible.
- **Bajo:** Datos demográficos globales de categorización agregada (nacionalidad, provincia de nacimiento, nivel educativo), que no permiten reidentificar directamente al individuo sin cruzamiento de tablas complejas.
