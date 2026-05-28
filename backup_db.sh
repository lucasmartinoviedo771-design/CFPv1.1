#!/bin/bash
# Script de Backup Automático de Base de Datos - CFP

# Carga las variables específicas de MySQL de forma segura desde el archivo .env
if [ -f /opt/CFP/.env ]; then
    MYSQL_ROOT_PASSWORD=$(grep -E "^MYSQL_ROOT_PASSWORD=" /opt/CFP/.env | cut -d'=' -f2)
    MYSQL_DATABASE=$(grep -E "^MYSQL_DATABASE=" /opt/CFP/.env | cut -d'=' -f2)
fi

# Valores por defecto si no se cargaron correctamente
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-"root"}
MYSQL_DATABASE=${MYSQL_DATABASE:-"CFP"}

# Almacenamiento seguro FUERA del directorio del proyecto (en la raíz /opt/backups)
BACKUP_DIR="/opt/backups"
mkdir -p "$BACKUP_DIR"
FILENAME="$BACKUP_DIR/cfp_backup_$(date +%Y%m%d_%H%M%S).sql.gz"

# Ejecuta el volcado de la base de datos desde el contenedor Docker y lo comprime
docker exec cfp_db_prod mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" | gzip > "$FILENAME"

# Mantener solo los respaldos de los últimos 30 días para no saturar el disco
find "$BACKUP_DIR" -type f -name "cfp_backup_*.sql.gz" -mtime +30 -delete

echo "Backup creado con éxito: $FILENAME"
