from unittest.mock import patch
from django.contrib.auth.models import User, Group
from django.test import TestCase
from django.core.management import call_command
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import BloqueDeFechas, Programa, Bloque, Modulo, Cohorte, Estudiante, Inscripcion, ConfiguracionPreinscripcionVideojuegos, Asistencia, Nota, Examen

class VideojuegosTests(TestCase):
    def setUp(self):
        from django.core.cache import cache
        cache.clear()

        # 1. Create BloqueDeFechas required by VJ seed
        self.bloque_fechas, _ = BloqueDeFechas.objects.get_or_create(nombre="Test Bloque Fechas")
        
        # 2. Run VJ seeding command
        call_command('seed_videojuegos')
        
        # 2.5 Initialize VJ configuration
        self.vj_config = ConfiguracionPreinscripcionVideojuegos.get()
        self.vj_config.preinscripcion_abierta = True
        self.vj_config.save()
        
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
        titulo_file = SimpleUploadedFile("titulo.pdf", pdf_content, content_type="application/pdf")
        payload["bloque_ids"] = f"{optative_block.id}"
        payload["dni_digitalizado"] = dni_file_2
        payload["titulo_secundario_digitalizado"] = titulo_file
        
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

    def test_configuracion_endpoints(self):
        """Verify GET /videojuegos/config and PATCH /videojuegos/config endpoints."""
        # 1. GET config (publicly accessible)
        self.client.credentials()
        resp = self.client.get("/api/v2/videojuegos/config")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["preinscripcion_abierta"])

        # 2. PATCH config (requires Videojuegos role/access)
        # Unauthorized (no credentials)
        payload = {"preinscripcion_abierta": False, "mensaje_cierre": "Cerrado temporalmente"}
        resp = self.client.patch("/api/v2/videojuegos/config", payload, format="json")
        self.assertEqual(resp.status_code, 401)

        # Authenticated as VJ Coordinator
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.vj_token}")
        resp = self.client.patch("/api/v2/videojuegos/config", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.json()["preinscripcion_abierta"])
        self.assertEqual(resp.json()["mensaje_cierre"], "Cerrado temporalmente")

    def test_preinscripcion_closed_flow(self):
        """Verify that when pre-registration is closed, public pre-registration returns 403."""
        # Close VJ pre-registration
        self.vj_config.preinscripcion_abierta = False
        self.vj_config.save()

        vj_prog = Programa.objects.get(codigo="VJ")
        from django.core.files.uploadedfile import SimpleUploadedFile
        pdf_content = b"%PDF-1.4 mock content"
        dni_file = SimpleUploadedFile("dni3.pdf", pdf_content, content_type="application/pdf")
        optative_block = Bloque.objects.get(programa=vj_prog, nombre="Arte y Animación")
        
        payload = {
            "apellido": "Test",
            "nombre": "VJ Student Closed",
            "email": "vjclosed@example.com",
            "dni": "99999992",
            "fecha_nacimiento": "2000-01-01",
            "programa_id": vj_prog.id,
            "bloque_ids": f"{optative_block.id}",
            "dni_digitalizado": dni_file,
            "recaptcha_token": "mock_token_vj"
        }
        
        with patch('core.utils.recaptcha.verify_recaptcha', return_value=True):
            resp = self.client.post("/api/v2/preinscripcion", payload, format="multipart")
            self.assertEqual(resp.status_code, 403)

    def test_alumnos_endpoints(self):
        """Verify GET /videojuegos/alumnos and edit endpoints."""
        vj_prog = Programa.objects.get(codigo="VJ")
        vj_student = Estudiante.objects.create(
            apellido="VJAlumno", nombre="Test", dni="66666661", email="vjalumno@example.com", estatus="Preinscripto"
        )
        cohorte = Cohorte.objects.filter(programa=vj_prog).first()
        modulo = Modulo.objects.filter(bloque=cohorte.bloque).first()
        Inscripcion.objects.create(estudiante=vj_student, cohorte=cohorte, modulo=modulo, estado="PREINSCRIPTO")

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.vj_token}")

        # 1. GET /videojuegos/alumnos
        resp = self.client.get("/api/v2/videojuegos/alumnos")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        student_ids = [s["id"] for s in data]
        self.assertIn(vj_student.id, student_ids)

        # 2. GET /videojuegos/alumnos/{id}
        resp = self.client.get(f"/api/v2/videojuegos/alumnos/{vj_student.id}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["apellido"], "VJAlumno")

        # 3. PATCH /videojuegos/alumnos/{id}
        payload = {
            "apellido": "VJAlumnoMod",
            "nombre": "TestMod",
            "dni": "66666661",
            "email": "vjalumno@example.com",
            "estatus": "Regular"
        }
        resp = self.client.patch(f"/api/v2/videojuegos/alumnos/{vj_student.id}", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["apellido"], "VJAlumnoMod")
        self.assertEqual(resp.json()["estatus"], "Regular")

    def test_inscripciones_isolation_and_crud(self):
        """Test GET, POST, PATCH/PUT, and DELETE for /videojuegos/inscripciones and check isolation."""
        from core.models import Inscripcion, Cohorte, Modulo, Estudiante
        vj_prog = Programa.objects.get(codigo="VJ")
        vj_cohorte = Cohorte.objects.filter(programa=vj_prog).first()
        vj_modulo = Modulo.objects.filter(bloque=vj_cohorte.bloque).first()
        
        # 1. Create a VJ student and a CFP student
        vj_student = Estudiante.objects.create(
            apellido="VJStudent", nombre="Insc", dni="11111101", email="vjinsc@example.com", estatus="Preinscripto"
        )
        cfp_student = Estudiante.objects.create(
            apellido="CFPStudent", nombre="Insc", dni="11111102", email="cfpinsc@example.com", estatus="Preinscripto"
        )
        
        # Create a VJ inscription and a CFP inscription
        vj_insc = Inscripcion.objects.create(estudiante=vj_student, cohorte=vj_cohorte, modulo=vj_modulo, estado="CURSANDO")
        cfp_insc = Inscripcion.objects.create(estudiante=cfp_student, cohorte=self.cfp_cohorte, modulo=self.cfp_modulo, estado="CURSANDO")
        
        # 2. Authenticate as VJ user
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.vj_token}")
        
        # List VJ inscriptions -> should return only VJ inscription
        resp = self.client.get("/api/v2/videojuegos/inscripciones")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        ids = [i["id"] for i in data]
        self.assertIn(vj_insc.id, ids)
        self.assertNotIn(cfp_insc.id, ids)
        
        # 3. Create a VJ inscription
        vj_student2 = Estudiante.objects.create(
            apellido="VJStudent2", nombre="Insc", dni="11111103", email="vjinsc2@example.com", estatus="Preinscripto"
        )
        payload = {
            "estudiante_id": vj_student2.id,
            "cohorte_id": vj_cohorte.id,
            "modulo_id": vj_modulo.id,
            "estado": "CURSANDO"
        }
        resp = self.client.post("/api/v2/videojuegos/inscripciones", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["estudiante"]["id"], vj_student2.id)
        
        # Try to create VJ inscription referencing a CFP cohorte -> should fail (403)
        payload_invalid = {
            "estudiante_id": vj_student2.id,
            "cohorte_id": self.cfp_cohorte.id,
            "estado": "CURSANDO"
        }
        resp = self.client.post("/api/v2/videojuegos/inscripciones", payload_invalid, format="json")
        self.assertEqual(resp.status_code, 403)
        
        # 4. Update VJ inscription
        resp = self.client.patch(
            f"/api/v2/videojuegos/inscripciones/{vj_insc.id}",
            {
                "estudiante_id": vj_student.id,
                "cohorte_id": vj_cohorte.id,
                "estado": "EGRESADO"
            },
            format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["estado"], "EGRESADO")
        
        # Try to update CFP inscription -> should fail (403 or 404)
        resp = self.client.patch(
            f"/api/v2/videojuegos/inscripciones/{cfp_insc.id}",
            {
                "estudiante_id": cfp_student.id,
                "cohorte_id": self.cfp_cohorte.id,
                "estado": "EGRESADO"
            },
            format="json"
        )
        self.assertEqual(resp.status_code, 403)
        
        # 5. Delete VJ inscription
        resp = self.client.delete(f"/api/v2/videojuegos/inscripciones/{vj_insc.id}")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["deleted"])
        
        # Try to delete CFP inscription -> should fail (403)
        resp = self.client.delete(f"/api/v2/videojuegos/inscripciones/{cfp_insc.id}")
        self.assertEqual(resp.status_code, 403)

    def test_asistencias_isolation_and_crud(self):
        """Test GET, POST, and PATCH/PUT for /videojuegos/asistencia and check isolation."""
        from core.models import Asistencia, Inscripcion, Cohorte, Modulo, Estudiante
        vj_prog = Programa.objects.get(codigo="VJ")
        vj_cohorte = Cohorte.objects.filter(programa=vj_prog).first()
        vj_modulo = Modulo.objects.filter(bloque=vj_cohorte.bloque).first()
        
        # Create VJ student and CFP student
        vj_student = Estudiante.objects.create(
            apellido="VJStudent", nombre="Asis", dni="22222201", email="vjasis@example.com", estatus="Preinscripto"
        )
        cfp_student = Estudiante.objects.create(
            apellido="CFPStudent", nombre="Asis", dni="22222202", email="cfpasis@example.com", estatus="Preinscripto"
        )
        
        # We need VJ enrollment for attendance checks
        Inscripcion.objects.create(estudiante=vj_student, cohorte=vj_cohorte, modulo=vj_modulo, estado="CURSANDO")
        
        # Create VJ attendance and CFP attendance
        vj_att = Asistencia.objects.create(estudiante=vj_student, modulo=vj_modulo, fecha="2026-06-12", presente=True)
        cfp_att = Asistencia.objects.create(estudiante=cfp_student, modulo=self.cfp_modulo, fecha="2026-06-12", presente=True)
        
        # Authenticate as VJ user
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.vj_token}")
        
        # 1. GET /videojuegos/asistencia -> should return only VJ attendance
        resp = self.client.get("/api/v2/videojuegos/asistencia")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        ids = [a["id"] for a in data]
        self.assertIn(vj_att.id, ids)
        self.assertNotIn(cfp_att.id, ids)
        
        # 2. POST /videojuegos/asistencia -> valid creation
        vj_student2 = Estudiante.objects.create(
            apellido="VJStudent2", nombre="Asis", dni="22222203", email="vjasis2@example.com", estatus="Preinscripto"
        )
        Inscripcion.objects.create(estudiante=vj_student2, cohorte=vj_cohorte, modulo=vj_modulo, estado="CURSANDO")
        
        payload = {
            "estudiante": vj_student2.id,
            "modulo": vj_modulo.id,
            "fecha": "2026-06-12",
            "presente": False
        }
        resp = self.client.post("/api/v2/videojuegos/asistencia", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.json()["presente"])
        
        # Try POST with CFP module -> should fail (403)
        payload_invalid = {
            "estudiante": vj_student2.id,
            "modulo": self.cfp_modulo.id,
            "fecha": "2026-06-12",
            "presente": True
        }
        resp = self.client.post("/api/v2/videojuegos/asistencia", payload_invalid, format="json")
        self.assertEqual(resp.status_code, 403)
        
        # Try POST with CFP student -> should fail (403)
        payload_invalid2 = {
            "estudiante": cfp_student.id,
            "modulo": vj_modulo.id,
            "fecha": "2026-06-12",
            "presente": True
        }
        resp = self.client.post("/api/v2/videojuegos/asistencia", payload_invalid2, format="json")
        self.assertEqual(resp.status_code, 403)
        
        # 3. PATCH /videojuegos/asistencia/{id}
        resp = self.client.patch(
            f"/api/v2/videojuegos/asistencia/{vj_att.id}",
            {
                "estudiante": vj_student.id,
                "modulo": vj_modulo.id,
                "fecha": "2026-06-12",
                "presente": False
            },
            format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.json()["presente"])
        
        # Try PATCH CFP attendance -> should fail (403)
        resp = self.client.patch(
            f"/api/v2/videojuegos/asistencia/{cfp_att.id}",
            {
                "estudiante": cfp_student.id,
                "modulo": self.cfp_modulo.id,
                "fecha": "2026-06-12",
                "presente": False
            },
            format="json"
        )
        self.assertEqual(resp.status_code, 403)

    def test_calificaciones_isolation_and_crud(self):
        """Test GET, POST, PATCH/PUT, and DELETE for /videojuegos/notas and check isolation."""
        from core.models import Examen, Nota, Inscripcion, Cohorte, Modulo, Estudiante
        vj_prog = Programa.objects.get(codigo="VJ")
        vj_cohorte = Cohorte.objects.filter(programa=vj_prog).first()
        vj_modulo = Modulo.objects.filter(bloque=vj_cohorte.bloque).first()
        
        # Create VJ student and CFP student
        vj_student = Estudiante.objects.create(
            apellido="VJStudent", nombre="Nota", dni="33333301", email="vjnota@example.com", estatus="Preinscripto"
        )
        cfp_student = Estudiante.objects.create(
            apellido="CFPStudent", nombre="Nota", dni="33333302", email="cfpnota@example.com", estatus="Preinscripto"
        )
        
        # Add VJ enrollment
        Inscripcion.objects.create(estudiante=vj_student, cohorte=vj_cohorte, modulo=vj_modulo, estado="CURSANDO")
        
        # Create VJ exam and CFP exam
        vj_exam = Examen.objects.create(modulo=vj_modulo, tipo_examen="PARCIAL", peso=1.0)
        cfp_exam = Examen.objects.create(modulo=self.cfp_modulo, tipo_examen="PARCIAL", peso=1.0)
        
        # Create VJ grade and CFP grade
        vj_grade = Nota.objects.create(estudiante=vj_student, examen=vj_exam, calificacion=8.5, aprobado=True)
        cfp_grade = Nota.objects.create(estudiante=cfp_student, examen=cfp_exam, calificacion=7.0, aprobado=True)
        
        # Authenticate as VJ user
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.vj_token}")
        
        # 1. GET /videojuegos/notas -> should return only VJ grade
        resp = self.client.get("/api/v2/videojuegos/notas")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        ids = [g["id"] for g in data]
        self.assertIn(vj_grade.id, ids)
        self.assertNotIn(cfp_grade.id, ids)
        
        # 2. POST /videojuegos/notas -> valid creation
        payload = {
            "estudiante": vj_student.id,
            "examen": vj_exam.id,
            "calificacion": 9.0,
            "aprobado": True,
            "fecha_calificacion": "2026-06-12T15:00:00Z"
        }
        # Clear existing grade for vj_student & vj_exam to avoid unique constraint issues
        vj_grade.delete()
        
        resp = self.client.post("/api/v2/videojuegos/notas", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["calificacion"], "9.00")
        new_grade_id = resp.json()["id"]
        
        # Try POST with CFP exam -> should fail (403)
        payload_invalid = {
            "estudiante": vj_student.id,
            "examen": cfp_exam.id,
            "calificacion": 8.0,
            "aprobado": True
        }
        resp = self.client.post("/api/v2/videojuegos/notas", payload_invalid, format="json")
        self.assertEqual(resp.status_code, 403)
        
        # Try POST with CFP student -> should fail (403)
        payload_invalid2 = {
            "estudiante": cfp_student.id,
            "examen": vj_exam.id,
            "calificacion": 8.0,
            "aprobado": True
        }
        resp = self.client.post("/api/v2/videojuegos/notas", payload_invalid2, format="json")
        self.assertEqual(resp.status_code, 403)
        
        # 3. PATCH /videojuegos/notas/{id}
        resp = self.client.patch(
            f"/api/v2/videojuegos/notas/{new_grade_id}",
            {
                "examen": vj_exam.id,
                "estudiante": vj_student.id,
                "calificacion": 5.0,
                "aprobado": False
            },
            format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["calificacion"], "5.00")
        self.assertFalse(resp.json()["aprobado"])
        
        # Try PATCH CFP grade -> should fail (403)
        resp = self.client.patch(
            f"/api/v2/videojuegos/notas/{cfp_grade.id}",
            {
                "examen": cfp_exam.id,
                "estudiante": cfp_student.id,
                "calificacion": 10.0,
                "aprobado": True
            },
            format="json"
        )
        self.assertEqual(resp.status_code, 403)
        
        # 4. DELETE /videojuegos/notas/{id}
        resp = self.client.delete(f"/api/v2/videojuegos/notas/{new_grade_id}")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["deleted"])
        
        # Try DELETE CFP grade -> should fail (403)
        resp = self.client.delete(f"/api/v2/videojuegos/notas/{cfp_grade.id}")
        self.assertEqual(resp.status_code, 403)
