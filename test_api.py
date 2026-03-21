import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

# We can bypass JWT by querying the python logic directly with mock request
import subprocess

code = """
import sys
from datetime import date
from django.contrib.auth.models import User
from core.api.dashboard import dashboard_stats
class MockReq:
    pass
req = MockReq()
req.user = User.objects.get(username='admin486321')
try:
    print('2025:', dashboard_stats(req, programa_id=10, fecha_desde=date(2025,3,10))['active_students_count'])
    print('2026:', dashboard_stats(req, programa_id=10, fecha_desde=date(2026,3,10))['active_students_count'])
except Exception as e:
    print('Error:', e)
"""
with open("/tmp/code.py", "w") as f:
    f.write(code)

import os
os.system('docker compose exec -T backend python manage.py shell < /tmp/code.py')
