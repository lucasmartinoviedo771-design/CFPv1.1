#!/bin/sh

# Esperar a que la base de datos esté lista
# El host de la DB será 'db' (definido en docker-compose)
echo "Esperando a MySQL..."
while ! nc -z db 3306; do
  sleep 0.5
done
echo "MySQL iniciado."

# Correr migraciones automáticamente
echo "Aplicando migraciones..."
python manage.py migrate

# Crear superusuario automático
echo "Verificando superusuario..."
python init_su.py

# Recolectar estáticos (opcional, si usas whitenoise o nginx para estáticos de django admin)
# python manage.py collectstatic --noinput

# Iniciar servidor con Gunicorn (Producción)
echo "Iniciando Gunicorn..."
exec gunicorn academia.wsgi:application --bind 0.0.0.0:8000
