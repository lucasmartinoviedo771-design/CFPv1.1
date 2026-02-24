import os
import sys

# Configurar Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "academia.settings")
import django
django.setup()

from django.test import Client
from django.contrib.auth.models import User

import json

client = Client()

# Get the admin user who executes the request (28126358 is Superadmin from screenshot)
admin_user = User.objects.get(username="28126358")
client.force_login(admin_user)

# The payload to send
payload = {
    "username": "36733654",
    "email": "estudiantes.cfp@malvinastdf.edu.ar",
    "first_name": "Javier Ivan",
    "last_name": "HERRERA BARRIEN",
    "groups": ["Preceptor"]
}

# The target user to be updated is ID 13 according to the table ID col
target_user = User.objects.get(id=13)

print("Target User ID:", target_user.id)
print("Target username before:", target_user.username)
print("Sending PATCH /api/v2/users/13")

response = client.patch(
    "/api/v2/users/13", 
    data=json.dumps(payload),
    content_type="application/json",
    SERVER_NAME="localhost",
)

print("")
print("Status Code:", response.status_code)
print("Response Content:")
try:
    print(json.dumps(response.json(), indent=2))
except:
    print(response.content)

