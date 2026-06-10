from django.test import TestCase
from core.models import Estudiante, Programa, Bloque, Examen, Nota

class BloqueAprobacionTests(TestCase):
    def setUp(self):
        self.estudiante = Estudiante.objects.create(
            email="student@example.com",
            apellido="Gomez",
            nombre="Juan",
            dni="12345678"
        )
        
        self.programa = Programa.objects.create(
            codigo="PROG",
            nombre="Programa Academico"
        )
        
        self.bloque1 = Bloque.objects.create(
            programa=self.programa,
            nombre="Bloque 1"
        )
        self.bloque2 = Bloque.objects.create(
            programa=self.programa,
            nombre="Bloque 2"
        )

    def test_not_approved_initially(self):
        """Test student has not approved any blocks initially."""
        self.assertFalse(self.estudiante.ha_aprobado_bloque(self.bloque1))
        self.assertEqual(self.estudiante.get_approved_bloques().count(), 0)

    def test_approved_via_final_sinc(self):
        """Test approval via FINAL_SINC exam."""
        examen = Examen.objects.create(
            bloque=self.bloque1,
            tipo_examen=Examen.FINAL_SINC,
            peso=1.0
        )
        # Note with qualification >= 6 approved=True
        Nota.objects.create(
            examen=examen,
            estudiante=self.estudiante,
            calificacion=7.0,
            aprobado=True,
            intento=1,
            es_nota_definitiva=True
        )
        
        self.assertTrue(self.estudiante.ha_aprobado_bloque(self.bloque1))
        approved_bloques = self.estudiante.get_approved_bloques()
        self.assertEqual(approved_bloques.count(), 1)
        self.assertEqual(approved_bloques.first(), self.bloque1)

    def test_failed_first_attempt_approved_second_attempt(self):
        """Test approval when first attempt failed but second attempt passed."""
        examen = Examen.objects.create(
            bloque=self.bloque1,
            tipo_examen=Examen.FINAL_VIRTUAL,
            peso=1.0
        )
        # First attempt failed
        Nota.objects.create(
            examen=examen,
            estudiante=self.estudiante,
            calificacion=4.0,
            aprobado=False,
            intento=1,
            es_nota_definitiva=False
        )
        # Second attempt approved
        Nota.objects.create(
            examen=examen,
            estudiante=self.estudiante,
            calificacion=8.0,
            aprobado=True,
            intento=2,
            es_nota_definitiva=True
        )
        
        self.assertTrue(self.estudiante.ha_aprobado_bloque(self.bloque1))
        self.assertEqual(self.estudiante.get_approved_bloques().count(), 1)

    def test_not_approved_if_failed_definitiva(self):
        """Test no approval if final score is failing."""
        examen = Examen.objects.create(
            bloque=self.bloque1,
            tipo_examen=Examen.FINAL_VIRTUAL,
            peso=1.0
        )
        Nota.objects.create(
            examen=examen,
            estudiante=self.estudiante,
            calificacion=5.0,
            aprobado=False,
            intento=1,
            es_nota_definitiva=True
        )
        
        self.assertFalse(self.estudiante.ha_aprobado_bloque(self.bloque1))
        self.assertEqual(self.estudiante.get_approved_bloques().count(), 0)
