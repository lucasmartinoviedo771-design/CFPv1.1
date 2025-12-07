import json
from datetime import date

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import (
    Programa,
    Bloque,
    Modulo,
    Examen,
    Estudiante,
    BloqueDeFechas,
    Cohorte,
    Inscripcion,
    Asistencia,
    Nota,
)


class ApiV2WriteTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="admin", password="pass1234")
        token = str(RefreshToken.for_user(self.user).access_token)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        self.programa = Programa.objects.create(codigo="PRG1", nombre="Programa 1")
        self.bloque = Bloque.objects.create(programa=self.programa, nombre="Bloque 1", orden=1)
        self.modulo = Modulo.objects.create(bloque=self.bloque, nombre="Modulo 1", orden=1)
        self.examen = Examen.objects.create(modulo=self.modulo, tipo_examen=Examen.PARCIAL)
        self.bloque_fechas = BloqueDeFechas.objects.create(nombre="Calendario 1", fecha_inicio=date(2025, 1, 1))
        self.cohorte = Cohorte.objects.create(programa=self.programa, bloque_fechas=self.bloque_fechas, nombre="Cohorte A")

    def test_crear_estudiante(self):
        payload = {
            "email": "test@example.com",
            "apellido": "Perez",
            "nombre": "Juan",
            "dni": "12345678",
        }
        resp = self.client.post("/api/v2/estudiantes", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["dni"], "12345678")
        self.assertTrue(Estudiante.objects.filter(dni="12345678").exists())

    def test_crear_inscripcion(self):
        est = Estudiante.objects.create(email="test2@example.com", apellido="Lopez", nombre="Ana", dni="87654321")
        payload = {
            "estudiante_id": est.id,
            "cohorte_id": self.cohorte.id,
            "estado": Inscripcion.ACTIVO,
        }
        resp = self.client.post("/api/v2/inscripciones", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["cohorte_id"], self.cohorte.id)

    def test_crear_asistencia(self):
        est = Estudiante.objects.create(email="test3@example.com", apellido="Suarez", nombre="Pedro", dni="99999999")
        payload = {
            "estudiante": est.id,
            "modulo": self.modulo.id,
            "fecha": "2025-02-01",
            "presente": True,
        }
        resp = self.client.post("/api/v2/examenes/asistencias", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(Asistencia.objects.filter(estudiante=est, modulo=self.modulo).exists())
        # listar
        resp_list = self.client.get(f"/api/v2/examenes/asistencias?modulo_id={self.modulo.id}")
        self.assertEqual(resp_list.status_code, 200)
        self.assertGreaterEqual(len(resp_list.json()), 1)

    def test_crear_nota(self):
        est = Estudiante.objects.create(email="test4@example.com", apellido="Mendez", nombre="Laura", dni="55555555")
        payload = {
            "examen": self.examen.id,
            "estudiante": est.id,
            "calificacion": 8.0,
            "aprobado": True,
        }
        resp = self.client.post("/api/v2/examenes/notas", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(Nota.objects.filter(estudiante=est, examen=self.examen, aprobado=True).exists())
        # listar
        resp_list = self.client.get(f"/api/v2/examenes/notas?estudiante_id={est.id}")
        self.assertEqual(resp_list.status_code, 200)
        self.assertGreaterEqual(len(resp_list.json()), 1)

    def test_crear_modulo_y_examen(self):
        payload_mod = {
            "bloque_id": self.bloque.id,
            "nombre": "Modulo API",
            "orden": 2,
            "es_practica": False,
            "asistencia_requerida_practica": 80,
        }
        resp_mod = self.client.post("/api/v2/modulos", data=json.dumps(payload_mod), content_type="application/json")
        self.assertEqual(resp_mod.status_code, 200)
        mod_id = resp_mod.json()["id"]
        payload_ex = {
            "modulo": mod_id,
            "tipo_examen": "PARCIAL",
            "peso": "0.5",
        }
        resp_ex = self.client.post("/api/v2/examenes", data=json.dumps(payload_ex), content_type="application/json")
        self.assertEqual(resp_ex.status_code, 200)
        self.assertIn("id", resp_ex.json())
