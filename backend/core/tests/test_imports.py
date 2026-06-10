from django.contrib.auth.models import User, Group
from django.test import TestCase
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework_simplejwt.tokens import RefreshToken

class ImportTests(TestCase):
    def setUp(self):
        # Create user with required group to bypass require_authenticated_group
        self.user = User.objects.create_superuser(username="admin_import", password="password123")
        self.docente_group = Group.objects.create(name="Docente")
        self.user.groups.add(self.docente_group)
        self.token = str(RefreshToken.for_user(self.user).access_token)
        
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_import_notas_unauthorized(self):
        """Test import endpoint returns 401 if unauthorized."""
        self.client.credentials()  # clear auth
        csv_content = b"DNI,Modulo,TipoExamen,Fecha,Nota\n12345678,Modulo1,PARCIAL,10/05/2026,8"
        csv_file = SimpleUploadedFile("notas.csv", csv_content, content_type="text/csv")
        
        resp = self.client.post("/api/v2/import-notas", {"file": csv_file}, format="multipart")
        self.assertEqual(resp.status_code, 401)

    def test_import_notas_success(self):
        """Test successful import notes request parses correctly."""
        csv_content = b"DNI,Modulo,TipoExamen,Fecha,Nota\n12345678,Modulo1,PARCIAL,10/05/2026,8"
        csv_file = SimpleUploadedFile("notas.csv", csv_content, content_type="text/csv")
        
        resp = self.client.post("/api/v2/import-notas", {"file": csv_file}, format="multipart")
        self.assertEqual(resp.status_code, 200)
        # Should return JSON result from call_command
        self.assertIn("imported", resp.json())
        self.assertIn("updated", resp.json())

    def test_import_asistencia_success(self):
        """Test successful import attendance request parses correctly."""
        csv_content = b"DNI,Modulo,Fecha,Presente\n12345678,Modulo1,10/05/2026,1"
        csv_file = SimpleUploadedFile("asistencia.csv", csv_content, content_type="text/csv")
        
        resp = self.client.post("/api/v2/import-asistencia", {"file": csv_file}, format="multipart")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("imported", resp.json())

    def test_import_inscripciones_success(self):
        """Test successful import inscriptions request parses correctly."""
        csv_content = b"DNI,Programa,Cohorte\n12345678,Prog1,Cohorte1"
        csv_file = SimpleUploadedFile("inscripciones.csv", csv_content, content_type="text/csv")
        
        resp = self.client.post("/api/v2/import-inscripciones", {"file": csv_file}, format="multipart")
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertIn("imported", resp.json())
