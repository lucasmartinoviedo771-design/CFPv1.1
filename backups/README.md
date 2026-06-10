# Procedimiento de Respaldo y Restauración de Base de Datos – CFP

Este directorio contiene las copias de seguridad de la base de datos de producción y los scripts correspondientes.

## Contenido del Directorio

- `backup_db.sh`: Script bash automatizado para realizar el volcado (`mysqldump`) de la base de datos desde el contenedor Docker y guardarlo comprimido en gzip.
- `produccion_cfp.sql.gz`: Copia comprimida de la base de datos de producción.

---

## 1. Procedimiento de Restauración (Verificación y Recuperación)

Para garantizar la integridad y probar que el backup no esté dañado, siga los siguientes pasos para restaurar en un entorno alternativo o en el contenedor de desarrollo local:

### Paso A: Preparar el archivo de backup
Asegúrese de contar con el archivo de backup en una ubicación accesible (por ejemplo, `backups/produccion_cfp.sql.gz`).

### Paso B: Restaurar en el contenedor Docker local
Utilice el siguiente comando para descomprimir y restaurar directamente en el contenedor de base de datos (`cfp_db_prod`):

```bash
# Si se cuenta con permisos de superusuario o usando el usuario cfp_user configurado
gunzip -c backups/produccion_cfp.sql.gz | docker exec -i cfp_db_prod mysql -u cfp_user -p"tY2Xj7MHHIP/Qvty0zg7FIa/w4ZU7Vfh" CFP
```

> [!NOTE]
> Si desea verificar la restauración en una base de datos temporal para no sobrescribir la actual:
> 1. Cree una base de datos vacía:
>    `docker exec cfp_db_prod mysql -u cfp_user -p"tY2Xj7MHHIP/Qvty0zg7FIa/w4ZU7Vfh" -e "CREATE DATABASE CFP_test_restore;"`
> 2. Restaure el dump en la base de datos temporal:
>    `gunzip -c backups/produccion_cfp.sql.gz | docker exec -i cfp_db_prod mysql -u cfp_user -p"tY2Xj7MHHIP/Qvty0zg7FIa/w4ZU7Vfh" CFP_test_restore`
> 3. Liste las tablas para verificar la restauración exitosa:
>    `docker exec cfp_db_prod mysql -u cfp_user -p"tY2Xj7MHHIP/Qvty0zg7FIa/w4ZU7Vfh" CFP_test_restore -e "SHOW TABLES;"`
> 4. Al finalizar la prueba, elimine la base de datos temporal:
>    `docker exec cfp_db_prod mysql -u cfp_user -p"tY2Xj7MHHIP/Qvty0zg7FIa/w4ZU7Vfh" -e "DROP DATABASE CFP_test_restore;"`

---

## 2. Ejecutar un Backup Manual

Si necesita realizar un backup de forma inmediata antes de un despliegue o cambio crítico:

```bash
# Ejecutar el script desde la raíz del proyecto
./backup_db.sh
```

El script guardará el archivo resultante en `/opt/backups/cfp_backup_[TIMESTAMP].sql.gz` y conservará solo los últimos 30 días de backups en el servidor para evitar saturación de almacenamiento.
