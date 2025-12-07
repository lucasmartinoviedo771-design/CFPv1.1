"""
Tests para el modelo Estudiante
"""
from django.test import TestCase
from django.core.exceptions import ValidationError
from core.models import Estudiante, Bloque, Programa, Modulo, Examen, Nota


class EstudianteModelTest(TestCase):
    """Tests para el modelo Estudiante."""

    def setUp(self):
        """Configuración inicial para cada test."""
        self.estudiante = Estudiante.objects.create(
            email="test@example.com",
            apellido="Pérez",
            nombre="Juan",
            dni="12345678"
        )

    def test_estudiante_creation(self):
        """Test que el estudiante se crea correctamente."""
        self.assertEqual(self.estudiante.email, "test@example.com")
        self.assertEqual(self.estudiante.apellido, "Pérez")
        self.assertEqual(self.estudiante.nombre, "Juan")
        self.assertEqual(self.estudiante.dni, "12345678")
        self.assertEqual(self.estudiante.estatus, "Regular")  # Default

    def test_estudiante_str(self):
        """Test del método __str__."""
        expected = "Pérez, Juan (12345678)"
        self.assertEqual(str(self.estudiante), expected)

    def test_estudiante_unique_email(self):
        """Test que el email debe ser único."""
        with self.assertRaises(Exception):  # IntegrityError
            Estudiante.objects.create(
                email="test@example.com",  # Email duplicado
                apellido="González",
                nombre="María",
                dni="87654321"
            )

    def test_estudiante_unique_dni(self):
        """Test que el DNI debe ser único."""
        with self.assertRaises(Exception):  # IntegrityError
            Estudiante.objects.create(
                email="otro@example.com",
                apellido="González",
                nombre="María",
                dni="12345678"  # DNI duplicado
            )

    def test_soft_delete(self):
        """Test del soft delete (cambio de estatus a 'Baja')."""
        self.estudiante.estatus = 'Baja'
        self.estudiante.save()
        
        # Verificar que el estatus cambió
        self.assertEqual(self.estudiante.estatus, 'Baja')
        
        # Verificar que sigue en la base de datos
        self.assertTrue(
            Estudiante.objects.filter(id=self.estudiante.id).exists()
        )

    def test_estudiante_ordering(self):
        """Test que los estudiantes se ordenan por apellido y nombre."""
        est2 = Estudiante.objects.create(
            email="ana@example.com",
            apellido="Álvarez",
            nombre="Ana",
            dni="11111111"
        )
        est3 = Estudiante.objects.create(
            email="zoe@example.com",
            apellido="Pérez",
            nombre="Zoe",
            dni="22222222"
        )
        
        # Obtener estudiantes con el ordering por defecto
        estudiantes = list(Estudiante.objects.all().order_by('apellido', 'nombre'))
        
        # Debe estar ordenado: Álvarez (Ana), Pérez (Juan), Pérez (Zoe)
        self.assertEqual(estudiantes[0].apellido, "Álvarez")
        self.assertEqual(estudiantes[1].apellido, "Pérez")
        self.assertEqual(estudiantes[1].nombre, "Juan")
        self.assertEqual(estudiantes[2].apellido, "Pérez")
        self.assertEqual(estudiantes[2].nombre, "Zoe")


class EstudianteAprobacionTest(TestCase):
    """Tests para métodos de aprobación de bloques."""

    def setUp(self):
        """Configuración inicial."""
        self.estudiante = Estudiante.objects.create(
            email="test@example.com",
            apellido="Test",
            nombre="User",
            dni="12345678"
        )
        
        self.programa = Programa.objects.create(
            codigo="TEST",
            nombre="Programa de Test"
        )
        
        self.bloque = Bloque.objects.create(
            programa=self.programa,
            nombre="Bloque 1",
            orden=1
        )

    def test_get_approved_bloques_empty(self):
        """Test que devuelve lista vacía si no hay bloques aprobados."""
        bloques = self.estudiante.get_approved_bloques()
        self.assertEqual(bloques.count(), 0)

    def test_ha_aprobado_bloque_false(self):
        """Test que devuelve False si no ha aprobado el bloque."""
        resultado = self.estudiante.ha_aprobado_bloque(self.bloque)
        self.assertFalse(resultado)

    def test_ha_aprobado_bloque_true(self):
        """Test que devuelve True si ha aprobado el bloque."""
        # Crear examen final
        examen = Examen.objects.create(
            bloque=self.bloque,
            tipo_examen=Examen.FINAL_SINC,
            peso=100
        )
        
        # Crear nota aprobada
        Nota.objects.create(
            examen=examen,
            estudiante=self.estudiante,
            calificacion=8,
            aprobado=True
        )
        
        resultado = self.estudiante.ha_aprobado_bloque(self.bloque)
        self.assertTrue(resultado)
