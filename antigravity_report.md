# Bitácora de Cambios y Continuidad del Proyecto CFP

> [!IMPORTANT]
> **CLÁUSULA DE ACTUALIZACIÓN OBLIGATORIA (MANDATORY UPDATE CLAUSE)**
> Cualquier desarrollador o agente de IA que realice modificaciones en este repositorio **DEBE** actualizar este archivo con el detalle de sus cambios **antes de realizar un push a GitHub**. Esto garantiza la continuidad de la información y evita duplicidades o pérdida de contexto sobre las decisiones tomadas.

---

## 📌 Historial de Cambios Recientes

### 🗓️ 20 de Mayo de 2026 (Segunda Parte) - Automatización de Correos de Nivelación (Habilidades Digitales)

Se ha integrado el envío automático del correo de invitación para el autodiagnóstico de nivelación en "Habilidades Digitales", asegurando que el estudiante reciba de inmediato el enlace de nivelación y el sistema no dependa únicamente de la generación manual sin notificar.

#### 1. Integración en el Panel de Administración (Generación Manual de Invitación)
* **Archivo**: [`backend/core/api/nivelacion.py`](file:///home/admin486321/CFP/backend/core/api/nivelacion.py)
* **Cambio**: Se actualizó el endpoint `/api/nivelacion/generate/{student_id}` para importar y llamar a `enviar_correo_nivelacion(estudiante.id)`. En lugar de recrear el token localmente, delega la creación consistente del token a la función de servicio y recupera de forma segura el nuevo token para retornar su información a la UI del administrador.

#### 2. Integración en la Pre-inscripción Pública (Flujo Automático)
* **Archivo**: [`backend/core/api/preinscripciones_publicas.py`](file:///home/admin486321/CFP/backend/core/api/preinscripciones_publicas.py)
* **Cambio**: Se actualizó la función `_enviar_confirmacion_preinscripcion` (que se ejecuta asíncronamente en segundo plano tras registrar una preinscripción). Ahora comprueba si el estudiante se ha registrado en el trayecto de "Habilidades Digitales" (programa con `id = 2`). De ser así, invoca `enviar_correo_nivelacion(estudiante.id)` automáticamente.

#### 3. Estabilidad y Pruebas Unitarias
* Se ejecutó el suite de tests unitarios (`pytest`) en el contenedor docker, obteniendo **17/17 OK (100% exitosos)**, garantizando que no se introdujeron regresiones.

### 🗓️ 20 de Mayo de 2026 - Corrección de Bugs de Auditoría, Rutas y Formulario de Nivelación

Se han resuelto de manera integral los problemas detectados en la auditoría académica y el flujo de pre-inscripción para Habilidades Digitales, logrando un suite de pruebas 100% verde (17/17 OK) y asegurando la estabilidad en producción.

#### 1. Correcciones en Base de Datos y Migraciones
* **Migración Django 0008 Corregida** (`backend/core/migrations/0008_cohorte_bloque_reuse_nombre.py`):
  * Se añadió la creación del campo `bloque` en la sección `database_operations` de `SeparateDatabaseAndState`. Anteriormente estaba vacía, lo que provocaba que la base de datos física no tuviera la columna `bloque_id`, haciendo fallar la creación de bases de datos desde cero (entornos locales/test).
* **Script de Inicialización de Superusuario (`backend/init_su.py`)**:
  * Se creó este script esencial que es invocado por `backend/entrypoint.sh` al levantar el contenedor de producción. De esta forma se previene el error crítico que impedía crear el administrador por defecto y causaba advertencias en los contenedores.

#### 2. Configuración y Seguridad
* **Cookies de Sesión Seguras en Producción** (`backend/academia/settings.py`):
  * Se activaron `SESSION_COOKIE_SECURE = True` y `CSRF_COOKIE_SECURE = True` en la configuración de producción. Dado que el servicio final utiliza HTTPS a través del proxy SSL de Cloudflare, esto robustece la seguridad contra secuestros de sesión.
* **Limpieza de Archivos Duplicados**:
  * Se eliminó el archivo de respaldo `frontend/src/pages/Estructura.jsx.backup` del código fuente.
  * Se eliminó la configuración de Vite duplicada `frontend/vite.config.ts`, consolidando todo en el archivo JavaScript oficial `frontend/vite.config.js` para evitar confusión entre configuraciones.

#### 3. Corrección de Rutas del API y Flujos Críticos
* **Reordenamiento de Rutas de Exámenes** (`backend/core/api/examenes.py`):
  * Se solucionó el conflicto de rutas en Django Ninja (`405 Method Not Allowed` al consultar `/asistencias` y `/mis-examenes`). Esto ocurría porque la ruta comodín `/{examen_id}` estaba definida por encima de los endpoints específicos, interceptando las llamadas erróneamente.
* **Solución de Bloqueo en Formulario de Nivelación** (`backend/core/api/nivelacion.py`):
  * Se corrigió el error `NameError: name 'target_module' is not defined` que provocaba la caída al enviar el formulario de pre-inscripción en Habilidades Digitales. Se declaró e inicializó adecuadamente la variable fuera de los bloques condicionales `try/except` y se resolvió de forma segura la asociación del programa y módulo correspondiente.

#### 4. Estabilidad y Pruebas Unitarias
* **Ajuste de Tests Unitarios** (`backend/core/tests/`):
  * Se adaptaron y corrigieron los tests correspondientes en `test_api_v2_write.py` y `test_estudiante.py`.
  * Se verificó que el suite de pruebas en el contenedor pase con éxito de forma íntegra (`17 tests OK`).

---

## 🛠️ Instrucciones para Desarrolladores Siguientes

Cuando tomes el control de este repositorio para continuar con nuevas tareas o resolver incidencias, por favor sigue estos pasos:
1. **Lee esta bitácora** para comprender el estado actual de los últimos cambios.
2. Al terminar tu trabajo y antes de hacer `git push`, añade una nueva sección al principio del historial (`## Historial de Cambios Recientes`) detallando tus modificaciones.
3. Asegúrate de que las pruebas unitarias sigan pasando correctamente en el entorno de desarrollo.
