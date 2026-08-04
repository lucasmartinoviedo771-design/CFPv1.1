# Instrucciones de Restauración de CFP desde el Backup

Este documento detalla el procedimiento paso a paso para levantar el servidor CFP desde cero en un nuevo entorno utilizando este backup.

## Requisitos Previos
El nuevo servidor debe tener instalado:
1. **Docker** y **Docker Compose** (V2).
2. Herramientas básicas de Linux (`tar`, `gzip`).

---

## Estructura del Backup
El archivo `.tar.gz` de backup contiene:
- `cfp_codebase_backup.tar.gz`: Todo el código fuente de `/opt/CFP`, incluyendo la configuración de Docker y el archivo `.env` con las contraseñas.
- `media_backup.tar.gz`: Todos los archivos multimedia cargados por los usuarios (imágenes, PDFs, etc.).
- `database_backup.sql.gz`: Volcado de la base de datos MySQL (estructura y datos).

---

## Procedimiento de Restauración

### Paso 1: Extraer el Backup Completo
1. Copia el archivo general de backup (ej. `cfp_full_backup_YYYYMMDD.tar.gz`) al nuevo servidor.
2. Extráelo en un directorio temporal:
   ```bash
   mkdir -p /tmp/cfp_restore
   tar -xzf cfp_full_backup_YYYYMMDD.tar.gz -C /tmp/cfp_restore
   ```

### Paso 2: Restaurar el Código Fuente y Configuración
1. Crea el directorio de la aplicación en `/opt/CFP` (o donde desees ubicarlo) y extrae el código:
   ```bash
   sudo mkdir -p /opt/CFP
   sudo tar -xzf /tmp/cfp_restore/cfp_codebase_backup.tar.gz -C /opt/CFP
   ```
2. Asegúrate de que el archivo `.env` esté presente en `/opt/CFP/.env` (este archivo ya está incluido en el backup de código).

### Paso 3: Crear los Volúmenes de Docker e Importar Media
1. Ve al directorio del proyecto:
   ```bash
   cd /opt/CFP
   ```
2. Levanta los contenedores en segundo plano. Esto creará automáticamente los volúmenes de Docker vacíos:
   ```bash
   docker compose up -d
   ```
3. Ahora restaura los archivos de media dentro del volumen de Docker correspondiente. Para esto, usamos un contenedor temporal de Alpine para extraer los archivos directamente en el volumen `cfp_media_data`:
   ```bash
   docker run --rm -v cfp_media_data:/volume -v /tmp/cfp_restore:/backup alpine tar -xzf /backup/media_backup.tar.gz -C /volume
   ```

### Paso 4: Restaurar la Base de Datos
1. Verifica que el contenedor de la base de datos (`cfp_db_prod`) esté en ejecución:
   ```bash
   docker ps
   ```
2. Carga los datos respaldados en el contenedor de MySQL utilizando la contraseña root definida en tu `.env` (el script cargará la contraseña automáticamente si estás en el directorio de la app):
   ```bash
   # Lee la contraseña de root del .env
   MYSQL_ROOT_PASSWORD=$(grep -E "^MYSQL_ROOT_PASSWORD=" /opt/CFP/.env | cut -d'=' -f2)
   MYSQL_DATABASE=$(grep -E "^MYSQL_DATABASE=" /opt/CFP/.env | cut -d'=' -f2)
   
   # Descomprime e importa la base de datos directamente al contenedor
   gunzip -c /tmp/cfp_restore/database_backup.sql.gz | docker exec -i cfp_db_prod mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"
   ```

### Paso 5: Reiniciar y Verificar
1. Una vez importada la base de datos y la media, reinicia todos los servicios para asegurar que carguen los datos correctamente:
   ```bash
   docker compose restart
   ```
2. Comprueba los logs para asegurarte de que no haya errores de conexión ni de base de datos:
   ```bash
   docker compose logs -f
   ```
3. ¡Listo! El sistema ya debería estar completamente operativo en el nuevo servidor con la base de datos y la media restauradas.
