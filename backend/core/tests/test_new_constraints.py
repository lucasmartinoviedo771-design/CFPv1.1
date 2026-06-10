from django.test import TestCase
from django.core.exceptions import ValidationError
from core.models import Programa, Bloque, Modulo, Cohorte, HorarioCursada, Examen, Estudiante, Nota, BloqueDeFechas

class NewConstraintsTests(TestCase):
    def setUp(self):
        self.programa = Programa.objects.create(codigo="PRG1", nombre="Programa 1")
        self.bloque1 = Bloque.objects.create(programa=self.programa, nombre="Bloque 1")
        self.bloque2 = Bloque.objects.create(programa=self.programa, nombre="Bloque 2")
        self.modulo1 = Modulo.objects.create(bloque=self.bloque1, nombre="Modulo 1")
        self.bloque_fechas = BloqueDeFechas.objects.create(nombre="Calendario 1")
        self.cohorte = Cohorte.objects.create(
            programa=self.programa,
            bloque=self.bloque1,
            bloque_fechas=self.bloque_fechas,
            nombre="Cohorte A"
        )
        self.estudiante = Estudiante.objects.create(
            email="test@example.com",
            apellido="Perez",
            nombre="Juan",
            dni="12345678"
        )
        self.examen = Examen.objects.create(modulo=self.modulo1, tipo_examen=Examen.PARCIAL)

    def test_c3_aprobado_auto_synchronization(self):
        """Test C3: El campo 'aprobado' se sincroniza automáticamente con la calificacion en save()"""
        nota = Nota.objects.create(
            examen=self.examen,
            estudiante=self.estudiante,
            calificacion=8.5,
            aprobado=False  # Se pasa en False pero debe autocompletarse a True
        )
        self.assertTrue(nota.aprobado)

        nota2 = Nota.objects.create(
            examen=self.examen,
            estudiante=self.estudiante,
            intento=2,
            calificacion=4.0,
            aprobado=True  # Se pasa en True pero debe autocompletarse a False
        )
        self.assertFalse(nota2.aprobado)

    def test_c6_horario_cursada_duplicate_null_modulo(self):
        """Test C6: Evitar duplicados de HorarioCursada cuando modulo es NULL en save()"""
        HorarioCursada.objects.create(
            cohorte=self.cohorte,
            bloque=self.bloque1,
            modulo=None,
            dia_semana=HorarioCursada.LUNES,
            hora_inicio="08:00:00",
            hora_fin="10:00:00"
        )
        # Intentar crear un duplicado idéntico con modulo=None debe lanzar ValidationError
        duplicate = HorarioCursada(
            cohorte=self.cohorte,
            bloque=self.bloque1,
            modulo=None,
            dia_semana=HorarioCursada.LUNES,
            hora_inicio="08:00:00",
            hora_fin="10:00:00"
        )
        with self.assertRaises(ValidationError):
            duplicate.save()

    def test_m6_circular_correlatives(self):
        """Test M6: La señal m2m_changed detecta correlatividades circulares entre bloques"""
        # correlativas: bloque1 -> bloque2
        self.bloque1.correlativas.add(self.bloque2)

        # intentar agregar bloque1 como correlativa de bloque2 (creando un ciclo bloque2 -> bloque1 -> bloque2)
        # debe lanzar ValidationError debido al trigger m2m_changed
        with self.assertRaises(ValidationError):
            self.bloque2.correlativas.add(self.bloque1)

    def test_l1_date_coherence_modulo(self):
        """Test L1: Validación de coherencia de fechas en Modulo en save()"""
        modulo = Modulo(
            bloque=self.bloque1,
            nombre="Modulo Incoherente",
            fecha_inicio="2025-05-20",
            fecha_fin="2025-05-10"  # fin < inicio
        )
        with self.assertRaises(ValidationError):
            modulo.save()
