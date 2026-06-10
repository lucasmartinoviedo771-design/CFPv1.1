from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from django.core.cache import cache
from core.models import Estudiante, NivelacionDigital, Programa, Cohorte, BloqueDeFechas, Bloque, Modulo
from rest_framework_simplejwt.tokens import RefreshToken

class NivelacionTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        
        # Setup admin and regular user
        self.admin_user = User.objects.create_superuser(username="admin_niv", password="pass")
        self.admin_token = str(RefreshToken.for_user(self.admin_user).access_token)
        
        self.regular_user = User.objects.create_user(username="user_niv", password="pass")
        self.regular_token = str(RefreshToken.for_user(self.regular_user).access_token)
        
        # Setup student
        self.estudiante = Estudiante.objects.create(
            email="stu_niv@example.com",
            apellido="Rodriguez",
            nombre="Maria",
            dni="22334455"
        )
        
        self.nivelacion = NivelacionDigital.objects.create(
            estudiante=self.estudiante,
            token="diagnostic-test-token-12345"
        )
        
        # Setup academic structure for diagnostic inscripcion
        self.programa = Programa.objects.create(codigo="HD", nombre="Habilidades Digitales")
        self.bloque = Bloque.objects.create(programa=self.programa, nombre="Bloque HD")
        self.modulo1 = Modulo.objects.create(bloque=self.bloque, nombre="Módulo 1 de HD")
        self.modulo2 = Modulo.objects.create(bloque=self.bloque, nombre="Módulo 2 de HD")
        
        self.cohorte = Cohorte.objects.create(
            programa=self.programa,
            bloque=self.bloque,
            bloque_fechas=BloqueDeFechas.objects.create(nombre="Config HD"),
            nombre="Cohorte HD"
        )

    def test_generate_token_unauthenticated(self):
        """Test token generation requires authentication."""
        resp = self.client.post(f"/api/v2/nivelacion/generate/{self.estudiante.id}")
        self.assertEqual(resp.status_code, 401)

    def test_generate_token_forbidden_for_regular_user(self):
        """Test token generation is forbidden for non-admin users."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.regular_token}")
        resp = self.client.post(f"/api/v2/nivelacion/generate/{self.estudiante.id}")
        self.assertEqual(resp.status_code, 403)

    def test_generate_token_allowed_for_admin(self):
        """Test admin can generate token."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.admin_token}")
        resp = self.client.post(f"/api/v2/nivelacion/generate/{self.estudiante.id}")
        self.assertEqual(resp.status_code, 200)
        self.nivelacion.refresh_from_db()
        self.assertEqual(resp.json()["token"], self.nivelacion.token)

    def test_questions_no_leak_correct(self):
        """Test that get_questions does not include correct answers."""
        resp = self.client.get("/api/v2/nivelacion/questions")
        self.assertEqual(resp.status_code, 200)
        questions = resp.json()["questions"]
        for q in questions:
            self.assertNotIn("correct", q)

    def test_get_test_no_leak_correct(self):
        """Test that get_test does not include correct answers."""
        resp = self.client.get(f"/api/v2/nivelacion/test/{self.nivelacion.token}")
        self.assertEqual(resp.status_code, 200)
        questions = resp.json()["questions"]
        for q in questions:
            self.assertNotIn("correct", q)

    def test_submit_grading(self):
        """Test submit_test grades correctly and does not expose correct answers."""
        # Answer all correctly: correct for id 1 is 1, id 2 is 1, etc.
        answers = {
            "1": 1, "2": 1, "3": 1, "4": 1, "5": 2,
            "6": 1, "7": 2, "8": 2, "9": 1, "10": 2
        }
        
        # Mock registration to avoid thread execution email or check
        post_data = {
            "answers": answers,
            "wants_module1": False
        }
        resp = self.client.post(f"/api/v2/nivelacion/submit/{self.nivelacion.token}", post_data, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["score"], 10)
        self.assertTrue(resp.json()["passed"])

    def test_throttling_on_endpoints(self):
        """Test client IP rate limiting on public endpoints."""
        # Limit is 10, so 11th request must fail with 429
        for i in range(10):
            resp = self.client.get(f"/api/v2/nivelacion/test/{self.nivelacion.token}", HTTP_X_FORWARDED_FOR="192.168.1.50")
            self.assertEqual(resp.status_code, 200)
            
        resp = self.client.get(f"/api/v2/nivelacion/test/{self.nivelacion.token}", HTTP_X_FORWARDED_FOR="192.168.1.50")
        self.assertEqual(resp.status_code, 429)
        self.assertIn("Demasiados intentos", resp.json()["detail"])
        
        # But a different IP should be allowed
        resp = self.client.get(f"/api/v2/nivelacion/test/{self.nivelacion.token}", HTTP_X_FORWARDED_FOR="192.168.1.51")
        self.assertEqual(resp.status_code, 200)
