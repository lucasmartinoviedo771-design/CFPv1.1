# Reporte de Auditoría Académica CFP: Bugs, Falencias y Mejoras Detectadas

He realizado una revisión exhaustiva del proyecto **CFP** (Backend en Django y Frontend en React/Vite). Este reporte describe los hallazgos técnicos más significativos divididos en categorías de severidad, con sus respectivos impactos y las soluciones recomendadas.

**Nota:** Este archivo `antigravity_report.md` está en la raíz de tu proyecto para que puedas leerlo cómodamente y borrarlo fácilmente en cuanto termines de revisarlo.

---

## 1. Hallazgos Críticos / Severidad Alta

### 🔴 Error en el Historial de Migraciones de Django (Falla los tests de base de datos)
* **Archivo afectado:** `backend/core/migrations/0008_cohorte_bloque_reuse_nombre.py`
* **Descripción:** 
  La migración `0008` agrega un campo de tipo `ForeignKey` a `cohorte` apuntando a `bloque` mediante la instrucción `SeparateDatabaseAndState`. Sin embargo, el bloque de operaciones de base de datos (`database_operations`) se encuentra vacío (`database_operations=[]`).
  Esto causa que Django asuma a nivel de software que la columna `bloque_id` ya existe, pero la base de datos física no la tiene. Cuando Django intenta crear la restricción única `uniq_cohorte_programa_bloque_nombre` en la misma migración, el motor MySQL falla con el siguiente error:
  ```
  MySQLdb.OperationalError: (1072, "Key column 'bloque_id' doesn't exist in table")
  ```
* **Impacto:** 
  Es **imposible ejecutar los tests unitarios en un entorno limpio**, ya que la creación y migración de la base de datos de pruebas (`test_CFP`) falla de inmediato. También impide desplegar nuevos entornos de desarrollo o producción desde cero sin intervención manual.
* **Solución propuesta (Segura para Producción):**
  Como esta migración ya se aplicó en producción (donde la columna probablemente fue agregada manualmente o importada de un dump), modificarla ahora es 100% seguro porque los servidores con la migración ya completada la ignorarán.
  Debemos mover la definición del campo `bloque` dentro de `database_operations` en `0008_cohorte_bloque_reuse_nombre.py` de la siguiente forma:
  ```python
  migrations.SeparateDatabaseAndState(
      database_operations=[
          migrations.AddField(
              model_name="cohorte",
              name="bloque",
              field=models.ForeignKey(
                  blank=True,
                  help_text="Bloque académico al que aplica esta cohorte",
                  null=True,
                  on_delete=django.db.models.deletion.PROTECT,
                  related_name="cohortes",
                  to="core.bloque",
              ),
          ),
      ],
      state_operations=[
          migrations.AddField(
              model_name="cohorte",
              name="bloque",
              field=models.ForeignKey(
                  blank=True,
                  help_text="Bloque académico al que aplica esta cohorte",
                  null=True,
                  on_delete=django.db.models.deletion.PROTECT,
                  related_name="cohortes",
                  to="core.bloque",
              ),
          ),
      ],
  )
  ```

---

## 2. Hallazgos de Severidad Media

### 🟡 Archivo de Inicialización de Superusuario Faltante (`init_su.py`)
* **Archivo afectado:** `backend/entrypoint.sh` (línea 17)
* **Descripción:** 
  El script de arranque del contenedor backend en producción (`entrypoint.sh`) intenta ejecutar la inicialización automática del administrador ejecutando:
  ```bash
  python init_su.py
  ```
  Sin embargo, el archivo `init_su.py` **no existe** en la carpeta `/app` ni en el repositorio de código.
* **Impacto:**
  El sistema registra un error en los logs del contenedor: `python: can't open file '/app/init_su.py': [Errno 2] No such file or directory`. Gunicorn continúa iniciando (evitando la caída del servicio), pero la funcionalidad de asegurar la existencia de una cuenta administradora por defecto no se ejecuta.
* **Solución propuesta:**
  Crear el archivo `backend/init_su.py` con una lógica segura que lea del `.env` para crear el superusuario en caso de que no exista:
  ```python
  import os
  import django

  os.environ.setdefault("DJANGO_SETTINGS_MODULE", "academia.settings")
  django.setup()

  from django.contrib.auth.models import User

  username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "admin")
  email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@example.com")
  password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

  if password:
      if not User.objects.filter(username=username).exists():
          User.objects.create_superuser(username=username, email=email, password=password)
          print(f"Superusuario '{username}' creado exitosamente.")
      else:
          print(f"Superusuario '{username}' ya existe.")
  ```

### 🟡 Configuración Insegura de Cookies de Sesión en Producción
* **Archivo afectado:** `backend/academia/settings.py` (líneas 112-113)
* **Descripción:**
  Las cookies de sesión y CSRF se configuran de forma insegura en producción (`DEBUG = False`):
  ```python
  SESSION_COOKIE_SECURE = False
  CSRF_COOKIE_SECURE = False
  ```
  La nota indica que se deshabilitó porque el backend funciona internamente bajo HTTP. Sin embargo, el sitio web público `https://cfp.lucasoviedodev.org` **sí utiliza HTTPS** en el navegador del usuario final gracias a la terminación SSL de Cloudflare.
* **Impacto:**
  Al no tener habilitado el flag `Secure`, las cookies de sesión del usuario pueden transmitirse a través de canales no encriptados, dejándolo vulnerable a ataques de secuestro de sesión (Session Hijacking) mediante intercepción de tráfico de red.
* **Solución propuesta:**
  Habilitar ambos flags en el bloque de producción. Dado que el navegador cliente se conecta mediante HTTPS a Cloudflare, esto es totalmente compatible y altamente recomendado:
  ```python
  SESSION_COOKIE_SECURE = True
  CSRF_COOKIE_SECURE = True
  ```

---

## 3. Hallazgos de Severidad Baja / Limpieza

### 🟢 Archivos de Respaldo Redundantes en Código Fuente
* **Ruta afectada:** `frontend/src/pages/Estructura.jsx.backup`
* **Descripción:** 
  Existe un archivo de respaldo manual (`Estructura.jsx.backup`) guardado en la carpeta de páginas del código fuente de React.
* **Impacto:**
  Aumenta el ruido visual en la estructura de archivos e incrementa innecesariamente el peso del repositorio.
* **Solución propuesta:**
  Eliminar `Estructura.jsx.backup` (o moverlo fuera de la carpeta `src/` del proyecto) ya que Git se encarga de gestionar el control de versiones históricas de forma nativa.

### 🟢 Duplicidad de Archivos de Configuración de Vite
* **Rutas afectadas:** `frontend/vite.config.js` y `frontend/vite.config.ts`
* **Descripción:**
  El proyecto de frontend contiene tanto una versión en JavaScript (`vite.config.js`) como una versión en TypeScript (`vite.config.ts`) de la configuración de Vite.
* **Impacto:**
  Crea confusión para desarrolladores futuros sobre cuál de los dos archivos de configuración está activo y siendo utilizado realmente por el compilador de Vite.
* **Solución propuesta:**
  Consolidar en una sola configuración (preferentemente `vite.config.ts` si se utiliza TypeScript) y eliminar el archivo duplicado y en desuso.
