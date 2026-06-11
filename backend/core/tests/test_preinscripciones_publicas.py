import io
from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from core.models import Cohorte, Programa, Bloque, BloqueDeFechas, Estudiante, Modulo

class PreinscripcionesPublicasTests(TestCase):
    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        self.client = APIClient()
        
        # Setup test academic structure
        self.programa_niii = Programa.objects.create(
            codigo="NIII",
            nombre="Programador de Nivel III",
            activo=True,
            requiere_titulo_secundario=False
        )
        self.programa_otro = Programa.objects.create(
            codigo="OTRO",
            nombre="Otro Curso Laboral",
            activo=True,
            requiere_titulo_secundario=True
        )
        
        self.bloque_niii = Bloque.objects.create(
            programa=self.programa_niii,
            nombre="Bloque Principal"
        )
        self.bloque_otro = Bloque.objects.create(
            programa=self.programa_otro,
            nombre="Bloque Otro"
        )
        
        # Modulos are required for each Bloque
        self.modulo_niii = Modulo.objects.create(
            bloque=self.bloque_niii,
            nombre="Módulo 1 de NIII"
        )
        self.modulo_otro = Modulo.objects.create(
            bloque=self.bloque_otro,
            nombre="Módulo 1 de Otro"
        )
        
        self.bloque_fechas = BloqueDeFechas.objects.create(
            nombre="Fechas Test"
        )
        
        # Cohortes
        self.cohorte_niii = Cohorte.objects.create(
            programa=self.programa_niii,
            bloque=self.bloque_niii,
            bloque_fechas=self.bloque_fechas,
            nombre="Cohorte NIII Test"
        )
        self.cohorte_otro = Cohorte.objects.create(
            programa=self.programa_otro,
            bloque=self.bloque_otro,
            bloque_fechas=self.bloque_fechas,
            nombre="Cohorte Otro Test"
        )

    @patch('core.utils.recaptcha.verify_recaptcha')
    def test_preinscripcion_adult_success(self, mock_recaptcha):
        """Test successful preinscripcion of an adult."""
        mock_recaptcha.return_value = True
        
        pdf_content = b"%PDF-1.4 mock content"
        dni_file = SimpleUploadedFile("dni.pdf", pdf_content, content_type="application/pdf")
        
        titulo_file = SimpleUploadedFile("titulo.pdf", pdf_content, content_type="application/pdf")
        
        post_data = {
            "email": "adult@example.com",
            "apellido": "Gomez",
            "nombre": "Pedro",
            "dni": "12345678",
            "fecha_nacimiento": "1990-05-15",
            "programa_id": self.programa_niii.id,
            "bloque_ids": f"{self.bloque_niii.id}",
            "dni_digitalizado": dni_file,
            "titulo_secundario_digitalizado": titulo_file,
            "recaptcha_token": "valid_token"
        }
        
        resp = self.client.post("/api/v2/preinscripcion", post_data, format="multipart")
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertTrue(resp.json()["ok"])
        
        # Verify student and inscripcion exist
        self.assertTrue(Estudiante.objects.filter(dni="12345678").exists())
        estudiante = Estudiante.objects.get(dni="12345678")
        self.assertEqual(estudiante.estatus, "Preinscripto")
        self.assertEqual(estudiante.inscripciones.count(), 1)

    @patch('core.utils.recaptcha.verify_recaptcha')
    def test_preinscripcion_minor_restriction(self, mock_recaptcha):
        """Test minor cannot register for other courses except Nivel III."""
        mock_recaptcha.return_value = True
        
        pdf_content = b"%PDF-1.4 mock content"
        dni_file = SimpleUploadedFile("dni.pdf", pdf_content, content_type="application/pdf")
        
        post_data = {
            "email": "minor@example.com",
            "apellido": "Gomez",
            "nombre": "Pedro",
            "dni": "87654321",
            "fecha_nacimiento": "2012-05-15", # age 14 or 15
            "programa_id": self.programa_otro.id,
            "bloque_ids": f"{self.bloque_otro.id}",
            "dni_digitalizado": dni_file,
            "recaptcha_token": "valid_token"
        }
        
        resp = self.client.post("/api/v2/preinscripcion", post_data, format="multipart")
        # Should fail because program is not Nivel III
        self.assertEqual(resp.status_code, 400)

    @patch('core.utils.recaptcha.verify_recaptcha')
    def test_preinscripcion_invalid_recaptcha(self, mock_recaptcha):
        """Test registration fails if reCAPTCHA verification fails."""
        mock_recaptcha.return_value = False
        
        pdf_content = b"%PDF-1.4 mock"
        dni_file = SimpleUploadedFile("dni.pdf", pdf_content, content_type="application/pdf")
        
        post_data = {
            "email": "test@example.com",
            "apellido": "Test",
            "nombre": "User",
            "dni": "11223344",
            "fecha_nacimiento": "1995-01-01",
            "programa_id": self.programa_niii.id,
            "bloque_ids": f"{self.bloque_niii.id}",
            "dni_digitalizado": dni_file,
            "recaptcha_token": "invalid_token"
        }
        
        resp = self.client.post("/api/v2/preinscripcion", post_data, format="multipart")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("reCAPTCHA", resp.json()["detail"])

    @patch('core.utils.recaptcha.verify_recaptcha')
    def test_preinscripcion_updates_email_for_existing_student(self, mock_recaptcha):
        """Test that re-registering with the same DNI updates the student's email."""
        mock_recaptcha.return_value = True
        
        # 1. First registration
        pdf_content = b"%PDF-1.4 mock content"
        dni_file = SimpleUploadedFile("dni.pdf", pdf_content, content_type="application/pdf")
        titulo_file = SimpleUploadedFile("titulo.pdf", pdf_content, content_type="application/pdf")
        post_data = {
            "email": "old_email@example.com",
            "apellido": "Gomez",
            "nombre": "Pedro",
            "dni": "12345678",
            "fecha_nacimiento": "1990-05-15",
            "programa_id": self.programa_niii.id,
            "bloque_ids": f"{self.bloque_niii.id}",
            "dni_digitalizado": dni_file,
            "titulo_secundario_digitalizado": titulo_file,
            "recaptcha_token": "valid_token"
        }
        resp = self.client.post("/api/v2/preinscripcion", post_data, format="multipart")
        self.assertEqual(resp.status_code, 200, resp.content)
        
        student = Estudiante.objects.get(dni="12345678")
        self.assertEqual(student.email, "old_email@example.com")
        
        # 2. Second registration with new email (recreating files to avoid consumed stream issues)
        dni_file2 = SimpleUploadedFile("dni.pdf", pdf_content, content_type="application/pdf")
        titulo_file2 = SimpleUploadedFile("titulo.pdf", pdf_content, content_type="application/pdf")
        post_data["email"] = "new_email@example.com"
        post_data["dni_digitalizado"] = dni_file2
        post_data["titulo_secundario_digitalizado"] = titulo_file2
        
        resp2 = self.client.post("/api/v2/preinscripcion", post_data, format="multipart")
        self.assertEqual(resp2.status_code, 200, resp2.content)
        
        student.refresh_from_db()
        self.assertEqual(student.email, "new_email@example.com")

    @patch('core.utils.recaptcha.verify_recaptcha')
    def test_preinscripcion_duplicate_email_blocked_for_different_dni(self, mock_recaptcha):
        """Test that registering a different DNI with an existing email is blocked."""
        mock_recaptcha.return_value = True
        
        # 1. Register first student
        pdf_content = b"%PDF-1.4 mock content"
        dni_file = SimpleUploadedFile("dni.pdf", pdf_content, content_type="application/pdf")
        titulo_file = SimpleUploadedFile("titulo.pdf", pdf_content, content_type="application/pdf")
        post_data = {
            "email": "shared_email@example.com",
            "apellido": "Gomez",
            "nombre": "Pedro",
            "dni": "11111111",
            "fecha_nacimiento": "1990-05-15",
            "programa_id": self.programa_niii.id,
            "bloque_ids": f"{self.bloque_niii.id}",
            "dni_digitalizado": dni_file,
            "titulo_secundario_digitalizado": titulo_file,
            "recaptcha_token": "valid_token"
        }
        resp = self.client.post("/api/v2/preinscripcion", post_data, format="multipart")
        self.assertEqual(resp.status_code, 200, resp.content)
        
        # 2. Try to register second student with the same email but different DNI
        dni_file2 = SimpleUploadedFile("dni.pdf", pdf_content, content_type="application/pdf")
        titulo_file2 = SimpleUploadedFile("titulo.pdf", pdf_content, content_type="application/pdf")
        post_data2 = {
            "email": "shared_email@example.com",
            "apellido": "Lopez",
            "nombre": "Juan",
            "dni": "22222222",
            "fecha_nacimiento": "1992-08-20",
            "programa_id": self.programa_niii.id,
            "bloque_ids": f"{self.bloque_niii.id}",
            "dni_digitalizado": dni_file2,
            "titulo_secundario_digitalizado": titulo_file2,
            "recaptcha_token": "valid_token"
        }
        
        resp2 = self.client.post("/api/v2/preinscripcion", post_data2, format="multipart")
        self.assertEqual(resp2.status_code, 400)
        self.assertIn("correo electrónico", resp2.json().get("detail", ""))






class RecaptchaVerifyTests(TestCase):
    @patch('urllib.request.urlopen')
    def test_recaptcha_success(self, mock_urlopen):
        from django.test import override_settings
        from core.utils.recaptcha import verify_recaptcha
        import json
        
        # Mock successful response
        mock_response = io.BytesIO(json.dumps({'success': True, 'score': 0.9}).encode('utf-8'))
        mock_urlopen.return_value.__enter__.return_value = mock_response
        
        with override_settings(RECAPTCHA_SECRET_KEY='test_secret', DEBUG=False):
            self.assertTrue(verify_recaptcha('some_token'))

    @patch('urllib.request.urlopen')
    def test_recaptcha_low_score(self, mock_urlopen):
        from django.test import override_settings
        from core.utils.recaptcha import verify_recaptcha
        import json
        
        # Mock low score
        mock_response = io.BytesIO(json.dumps({'success': True, 'score': 0.1}).encode('utf-8'))
        mock_urlopen.return_value.__enter__.return_value = mock_response
        
        with override_settings(RECAPTCHA_SECRET_KEY='test_secret', DEBUG=False):
            self.assertFalse(verify_recaptcha('some_token'))

    @patch('urllib.request.urlopen')
    def test_recaptcha_fail_closed_in_production(self, mock_urlopen):
        from django.test import override_settings
        from core.utils.recaptcha import verify_recaptcha
        
        # Mock exception
        mock_urlopen.side_effect = Exception("Connection timed out")
        
        # In production (DEBUG=False), it should fail closed (return False)
        with override_settings(RECAPTCHA_SECRET_KEY='test_secret', DEBUG=False):
            self.assertFalse(verify_recaptcha('some_token'))

    @patch('urllib.request.urlopen')
    def test_recaptcha_fail_open_in_debug(self, mock_urlopen):
        from django.test import override_settings
        from core.utils.recaptcha import verify_recaptcha
        
        # Mock exception
        mock_urlopen.side_effect = Exception("Connection timed out")
        
        # In development (DEBUG=True), it should fail open (return True)
        with override_settings(RECAPTCHA_SECRET_KEY='test_secret', DEBUG=True):
            self.assertTrue(verify_recaptcha('some_token'))

    def test_recaptcha_missing_key_production(self):
        from django.test import override_settings
        from core.utils.recaptcha import verify_recaptcha
        
        # In production (DEBUG=False), missing key should fail closed
        with override_settings(RECAPTCHA_SECRET_KEY='', DEBUG=False):
            self.assertFalse(verify_recaptcha('some_token'))

    def test_recaptcha_missing_key_debug(self):
        from django.test import override_settings
        from core.utils.recaptcha import verify_recaptcha
        
        # In development (DEBUG=True), missing key should fail open
        with override_settings(RECAPTCHA_SECRET_KEY='', DEBUG=True):
            self.assertTrue(verify_recaptcha('some_token'))

