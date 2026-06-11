from unittest.mock import patch
from django.contrib.auth.models import User, Group
from django.test import TestCase
from django.core.management import call_command
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import BloqueDeFechas, Programa, Bloque, Modulo, Cohorte, Estudiante, Inscripcion

class VideojuegosTests(TestCase):
    def setUp(self):
        # 1. Create BloqueDeFechas required by VJ seed
        self.bloque_fechas, _ = BloqueDeFechas.objects.get_or_create(nombre="Test Bloque Fechas")
        
        # 2. Run VJ seeding command
        call_command('seed_videojuegos')
        
        # 3. Create regular CFP objects for comparison
        self.cfp_program = Programa.objects.create(codigo="CFP_REGULAR", nombre="Programa Regular CFP", activo=True)
        self.cfp_bloque = Bloque.objects.create(programa=self.cfp_program, nombre="Bloque CFP")
        self.cfp_modulo = Modulo.objects.create(bloque=self.cfp_bloque, nombre="Modulo CFP")
        self.cfp_cohorte = Cohorte.objects.create(
            programa=self.cfp_program,
            bloque=self.cfp_bloque,
            nombre="Cohorte CFP 2026",
            fecha_inicio="2026-06-25",
            fecha_fin="2026-07-31",
            bloque_fechas=self.bloque_fechas
        )

        # 4. Users & Groups Setup
        # General admin
        self.admin_user = User.objects.create_superuser(username="admin_vj", password="pass1234")
        self.admin_token = str(RefreshToken.for_user(self.admin_user).access_token)

        # Videojuegos group/role
        self.vj_group, _ = Group.objects.get_or_create(name="Videojuegos")
        self.vj_user = User.objects.create_user(username="coordinador_vj", password="pass1234")
        self.vj_user.groups.add(self.vj_group)
        self.vj_token = str(RefreshToken.for_user(self.vj_user).access_token)

        # Docente group (regular CFP access)
        self.docente_group, _ = Group.objects.get_or_create(name="Docente")
        self.docente_user = User.objects.create_user(username="profesor_cfp", password="pass1234")
        self.docente_user.groups.add(self.docente_group)
        self.docente_token = str(RefreshToken.for_user(self.docente_user).access_token)

        self.client = APIClient()

    def test_public_offering_isolation(self):
        """Verify that VJ is excluded from general /preinscripcion/oferta unless explicitly requested."""
        # Unauthenticated request to standard offer endpoint
        self.client.credentials()
        resp = self.client.get("/api/v2/preinscripcion/oferta")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        
        # VJ should NOT be in the standard list
        items = data.get("items", [])
        vj_prog = Programa.objects.filter(codigo="VJ").first()
        if vj_prog:
            program_ids = [item["programa_id"] for item in items]
            self.assertNotIn(vj_prog.id, program_ids)

        # Request with programa_codigo=VJ
        resp = self.client.get("/api/v2/preinscripcion/oferta?programa_codigo=VJ")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        items = data.get("items", [])
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["programa_id"], vj_prog.id)

    @patch('core.utils.recaptcha.verify_recaptcha')
    def test_public_preinscripcion_validation(self, mock_recaptcha):
        """Verify VJ pre-inscription rules (optatives validation and auto-assignment)."""
        mock_recaptcha.return_value = True
        vj_prog = Programa.objects.get(codigo="VJ")
        
        from django.core.files.uploadedfile import SimpleUploadedFile
        pdf_content = b"%PDF-1.4 mock content"
        dni_file = SimpleUploadedFile("dni.pdf", pdf_content, content_type="application/pdf")
        
        # Try to register to VJ with NO optatives selected
        payload = {
            "apellido": "Test",
            "nombre": "VJ Student",
            "email": "vjtest@example.com",
            "dni": "99999991",
            "fecha_nacimiento": "2000-01-01",
            "programa_id": vj_prog.id,
            "dni_digitalizado": dni_file,
            "recaptcha_token": "mock_token_vj"
        }
        
        resp = self.client.post("/api/v2/preinscripcion", payload, format="multipart")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("optat", resp.json().get("detail", "").lower())

        # Now select one optative block (e.g. Arte y Animación)
        optative_block = Bloque.objects.get(programa=vj_prog, nombre="Arte y Animación")
        dni_file_2 = SimpleUploadedFile("dni2.pdf", pdf_content, content_type="application/pdf")
        payload["bloque_ids"] = f"{optative_block.id}"
        payload["dni_digitalizado"] = dni_file_2
        
        resp = self.client.post("/api/v2/preinscripcion", payload, format="multipart")
        self.assertEqual(resp.status_code, 200, resp.content)
        
        # Check that Student and Inscriptions were created
        student = Estudiante.objects.get(dni="99999991")
        self.assertEqual(student.estatus, "Preinscripto")
        
        # Check that the student has 4 inscriptions: 1 optative + 3 obligatory
        inscriptions = Inscripcion.objects.filter(estudiante=student)
        self.assertEqual(inscriptions.count(), 4)
        
        # Verify status of all VJ inscriptions is PREINSCRIPTO
        for ins in inscriptions:
            self.assertEqual(ins.estado, "PREINSCRIPTO")

    def test_role_based_isolation(self):
        """Verify that a user in the Videojuegos group cannot access regular CFP endpoints,
        but can access VJ pre-inscriptions management endpoints, which return only VJ students."""
        
        # Pre-inscribe a CFP student and a VJ student
        vj_prog = Programa.objects.get(codigo="VJ")
        
        # Create VJ student
        vj_student = Estudiante.objects.create(
            apellido="VJ", nombre="Student", dni="88888881", email="vj@example.com", estatus="Preinscripto"
        )
        for b in Bloque.objects.filter(programa=vj_prog):
            cohorte = Cohorte.objects.filter(programa=vj_prog, bloque=b).first()
            modulo = Modulo.objects.filter(bloque=b).first()
            Inscripcion.objects.create(estudiante=vj_student, cohorte=cohorte, modulo=modulo, estado="PREINSCRIPTO")

        # Create standard CFP student
        cfp_student = Estudiante.objects.create(
            apellido="CFP", nombre="Student", dni="88888882", email="cfp@example.com", estatus="Preinscripto"
        )
        Inscripcion.objects.create(estudiante=cfp_student, cohorte=self.cfp_cohorte, modulo=self.cfp_modulo, estado="PREINSCRIPTO")

        # 1. Videojuegos user requests regular CFP `/estudiantes` endpoint -> 403 Forbidden
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.vj_token}")
        resp = self.client.get("/api/v2/estudiantes")
        self.assertEqual(resp.status_code, 403)

        # 2. Videojuegos user requests `/videojuegos/preinscripciones` -> 200 OK
        resp = self.client.get("/api/v2/videojuegos/preinscripciones")
        self.assertEqual(resp.status_code, 200)
        
        # Check that ONLY the VJ student is returned
        data = resp.json()
        student_ids = [s["id"] for s in data]
        self.assertIn(vj_student.id, student_ids)
        self.assertNotIn(cfp_student.id, student_ids)

    def test_approve_reject_flow(self):
        """Verify approve and reject flow for VJ students."""
        vj_prog = Programa.objects.get(codigo="VJ")
        vj_student = Estudiante.objects.create(
            apellido="VJ", nombre="Flow", dni="77777771", email="vjflow@example.com", estatus="Preinscripto"
        )
        for b in Bloque.objects.filter(programa=vj_prog):
            cohorte = Cohorte.objects.filter(programa=vj_prog, bloque=b).first()
            modulo = Modulo.objects.filter(bloque=b).first()
            Inscripcion.objects.create(estudiante=vj_student, cohorte=cohorte, modulo=modulo, estado="PREINSCRIPTO")

        # 1. Approve VJ student using Videojuegos coordinator credentials
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.vj_token}")
        resp = self.client.patch(f"/api/v2/videojuegos/preinscripciones/{vj_student.id}", {"estado": "aprobado"}, format="json")
        self.assertEqual(resp.status_code, 200)
        
        # Verify status updates
        vj_student.refresh_from_db()
        self.assertEqual(vj_student.estatus, "Regular")
        for ins in Inscripcion.objects.filter(estudiante=vj_student):
            self.assertEqual(ins.estado, "CURSANDO")

        # 2. Reject VJ student
        resp = self.client.patch(f"/api/v2/videojuegos/preinscripciones/{vj_student.id}", {"estado": "rechazado"}, format="json")
        self.assertEqual(resp.status_code, 200)
        
        # Verify status updates
        vj_student.refresh_from_db()
        self.assertEqual(vj_student.estatus, "Baja")
        for ins in Inscripcion.objects.filter(estudiante=vj_student):
            self.assertEqual(ins.estado, "INACTIVO")
