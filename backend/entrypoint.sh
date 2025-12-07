#!/bin/sh

# Wait for database
echo "Waiting for database..."
while ! nc -z db 3306; do
  sleep 0.1
done
echo "Database started"

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start server
echo "Starting server..."
# Use gunicorn for production-like or runserver for dev. 
# Using runserver 0.0.0.0:8000 for now to allow easy debugging if needed, 
# but gunicorn is better for stability. Let's use runserver for this phase.
python manage.py runserver 0.0.0.0:8000
