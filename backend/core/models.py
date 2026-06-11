# backend/core/models.py
from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
import os

def _documento_upload_path(instance, filename, carpeta):
    _, ext = os.path.splitext(filename or "")
    ext = (ext or "").lower()
    dni = str(instance.dni or "sin_dni")
    return f"preinscripciones/{dni}/{carpeta}{ext}"


def dni_upload_path(instance, filename):
    return _documento_upload_path(instance, filename, "dni")


def titulo_upload_path(instance, filename):
    return _documento_upload_path(instance, filename, "titulo_secundario")


def dni_tutor_upload_path(instance, filename):
    return _documento_upload_path(instance, filename, "dni_tutor")


def nota_parental_upload_path(instance, filename):
    return _documento_upload_path(instance, filename, "autorizacion_parental")


class TimeStamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True

class Resolucion(TimeStamped):
    """
    Marco legal que habilita la oferta de capacitaciones.
    Ejemplo: Resolución 3601/2023
    """
    numero = models.CharField(
        max_length=50,
        unique=True,
        help_text="Número de resolución (Ej: 3601/2023)"
    )
    nombre = models.CharField(
        max_length=200,
        help_text="Nombre descriptivo de la resolución"
    )
    fecha_publicacion = models.DateField(
        help_text="Fecha de publicación oficial"
    )
    vigente = models.BooleanField(
        default=True,
        help_text="Indica si la resolución está vigente"
    )
    observaciones = models.TextField(
        blank=True,
        help_text="Notas adicionales sobre la resolución"
    )
    
    class Meta:
        ordering = ['-fecha_publicacion']
        verbose_name = "Resolución"
        verbose_name_plural = "Resoluciones"
    
    def __str__(self):
        return f"Resolución {self.numero}"

class Programa(TimeStamped):
    resolucion = models.ForeignKey(
        Resolucion,
        on_delete=models.PROTECT,
        related_name="programas",
        null=True,
        blank=True,
        help_text="Marco legal que habilita este programa"
    )
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=200)
    activo = models.BooleanField(default=True)
    requiere_titulo_secundario = models.BooleanField(
        default=False,
        help_text="Indica si para este programa se debe adjuntar título secundario.",
    )
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class BloqueDeFechas(TimeStamped):
    """Plantilla de calendario reutilizable (sin fecha fija)."""
    nombre = models.CharField(max_length=150, unique=True, help_text="Nombre de la plantilla (ej: 'Estándar 8 semanas')")
    descripcion = models.TextField(blank=True, help_text="Descripción de la secuencia de semanas")

    def __str__(self):
        return self.nombre

class SemanaConfig(TimeStamped):
    CLASE = "CLASE"
    PARCIAL = "PARCIAL"
    FINAL_VIRTUAL = "FINAL_VIRTUAL"
    FINAL_SINC = "FINAL_SINC"
    SIN_ACTIVIDADES = "SIN_ACTIVIDADES"
    TIPOS_SEMANA = [
        (CLASE, "Clase"),
        (PARCIAL, "Parcial"),
        (FINAL_VIRTUAL, "Final Virtual"),
        (FINAL_SINC, "Final Sincrónico"),
        (SIN_ACTIVIDADES, "Sin Actividades"),
    ]

    bloque = models.ForeignKey(BloqueDeFechas, on_delete=models.CASCADE, related_name='semanas_config')
    tipo = models.CharField(max_length=20, choices=TIPOS_SEMANA)
    orden = models.PositiveIntegerField()

    class Meta:
        ordering = ['bloque', 'orden']
        unique_together = ('bloque', 'orden')

    def __str__(self):
        return f"{self.bloque.nombre} - Semana {self.orden} ({self.get_tipo_display()})"

class Cohorte(TimeStamped):
    programa = models.ForeignKey(Programa, on_delete=models.CASCADE, related_name="cohortes")
    bloque = models.ForeignKey(
        "Bloque",
        on_delete=models.PROTECT,
        related_name="cohortes",
        help_text="Bloque académico al que aplica esta cohorte",
    )
    bloque_fechas = models.ForeignKey(BloqueDeFechas, on_delete=models.PROTECT, related_name="cohortes", help_text="Plantilla de calendario a usar")
    nombre = models.CharField(max_length=100)
    fecha_inicio = models.DateField(help_text="Fecha de inicio de esta cohorte", default=timezone.now)
    fecha_fin = models.DateField(null=True, blank=True, help_text="Fecha de fin calculada o definida para la cohorte")

    class Meta:
        ordering = ["-fecha_inicio"]
        constraints = [
            models.UniqueConstraint(
                fields=["programa", "bloque", "nombre"],
                name="uniq_cohorte_programa_bloque_nombre",
            )
        ]

    def clean(self):
        super().clean()
        if self.fecha_inicio and self.fecha_fin and self.fecha_fin < self.fecha_inicio:
            raise ValidationError("La fecha de fin no puede ser anterior a la fecha de inicio.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre

def validate_telefono(value):
    if value and (not value.isdigit() or len(value) != 10):
        raise ValidationError('El teléfono debe contener 10 dígitos (4 de característica + 6 de número).')

class Estudiante(TimeStamped):
    # --- Datos Personales Básicos ---
    email = models.EmailField(help_text="Correo Electrónico")
    apellido = models.CharField(max_length=120)
    nombre = models.CharField(max_length=120, verbose_name="Nombres")
    dni = models.CharField(max_length=20, unique=True, db_index=True)
    cuit = models.CharField(max_length=20, blank=True, verbose_name="CUIT")
    
    SEXO_OPCIONES = [('M', 'Masculino'), ('F', 'Femenino'), ('O', 'Otro')]
    sexo = models.CharField(max_length=1, choices=SEXO_OPCIONES, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)

    # --- Datos de Origen ---
    PAISES_COMUNES = [
        ('Argentina', 'Argentina'), ('Bolivia', 'Bolivia'), ('Brasil', 'Brasil'),
        ('Chile', 'Chile'), ('Paraguay', 'Paraguay'), ('Uruguay', 'Uruguay'),
        ('Otro', 'Otro')
    ]
    pais_nacimiento = models.CharField(max_length=60, choices=PAISES_COMUNES, blank=True)
    pais_nacimiento_otro = models.CharField(max_length=120, blank=True, verbose_name="Otro País de Nacimiento")
    nacionalidad = models.CharField(max_length=60, choices=PAISES_COMUNES, blank=True)
    nacionalidad_otra = models.CharField(max_length=120, blank=True, verbose_name="Otra Nacionalidad")
    lugar_nacimiento = models.CharField(max_length=120, blank=True, verbose_name="Lugar de Nacimiento (Provincia)")

    # --- Datos de Contacto y Domicilio ---
    domicilio = models.CharField(max_length=200, blank=True, verbose_name="Domicilio Particular")
    barrio = models.CharField(max_length=120, blank=True)
    ciudad = models.CharField(max_length=120, blank=True)
    telefono = models.CharField(max_length=10, blank=True, validators=[validate_telefono])

    # --- Datos Académicos y Estatus ---
    NIVEL_EDUCATIVO_OPCIONES = [
        ('Primaria Completa', 'Primaria Completa'),
        ('Secundaria Incompleta', 'Secundaria Incompleta'),
        ('Secundaria Completa', 'Secundaria Completa'),
        ('Terciaria/Universitaria Incompleta', 'Terciaria/Universitaria Incompleta'),
        ('Terciaria/Universitaria Completa', 'Terciaria/Universitaria Completa'),
        ('Terciaria/Universitaria', 'Terciaria/Universitaria'),
    ]
    nivel_educativo = models.CharField(max_length=60, choices=NIVEL_EDUCATIVO_OPCIONES, blank=True, verbose_name="Nivel Alcanzado")
    
    ESTATUS_REGULARIDAD = [('Regular', 'Regular'), ('Baja', 'Baja'), ('Condicional', 'Condicional'), ('Preinscripto', 'Preinscripto')]
    estatus = models.CharField(max_length=15, choices=ESTATUS_REGULARIDAD, default='Preinscripto', verbose_name="Estatus de Regularidad")

    # --- Conectividad y Recursos ---
    posee_pc = models.BooleanField(default=False, verbose_name="Posee PC en su Domicilio")
    posee_conectividad = models.BooleanField(default=False, verbose_name="Posee Conectividad a Internet")
    puede_traer_pc = models.BooleanField(default=False, verbose_name="Puede Traer PC a Clase")

    # --- Datos Laborales ---
    trabaja = models.BooleanField(default=False)
    lugar_trabajo = models.CharField(max_length=120, blank=True, verbose_name="Lugar de Trabajo")

    # --- Documentación (Archivos) ---
    dni_digitalizado = models.FileField(
        upload_to=dni_upload_path,
        blank=True,
        verbose_name="DNI digitalizado (Archivo)",
    )
    titulo_secundario_digitalizado = models.FileField(
        upload_to=titulo_upload_path,
        blank=True,
        verbose_name="Título secundario digitalizado (Archivo)",
    )

    # --- Datos de Tutor (para Menores de 18) ---
    tutor_nombre = models.CharField(max_length=200, blank=True, verbose_name="Nombre del Tutor")
    tutor_dni = models.CharField(max_length=20, blank=True, verbose_name="DNI del Tutor")
    tutor_telefono = models.CharField(max_length=15, blank=True, verbose_name="Teléfono del Tutor")
    
    dni_tutor_digitalizado = models.FileField(
        upload_to=dni_tutor_upload_path,
        blank=True,
        verbose_name="DNI del Tutor digitalizado (Archivo)",
    )
    nota_parental_firmada = models.FileField(
        upload_to=nota_parental_upload_path,
        blank=True,
        verbose_name="Nota de Autorización Parental Firmada (Archivo)",
    )
    
    # --- Gestión de Soft-Delete (Borrado Lógico) ---
    is_active = models.BooleanField(default=True, db_index=True, verbose_name="¿Está Activo?")
    archived_at = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de Archivado")

    # --- Gestión de Autorización Digital ---
    AUTORIZACION_ESTADOS = [
        ('PENDIENTE', 'Pendiente'),
        ('DIGITAL', 'Firma Digital (Selfie)'),
        ('MANUAL', 'Firma Manual (Papel)'),
    ]
    autorizacion_status = models.CharField(
        max_length=20, 
        choices=AUTORIZACION_ESTADOS, 
        default='PENDIENTE'
    )
    autorizacion_token = models.CharField(max_length=100, blank=True, null=True, unique=True)
    autorizacion_selfie = models.ImageField(
        upload_to='autorizaciones/selfies/', 
        blank=True, 
        null=True,
        verbose_name="Selfie de Conformidad"
    )
    autorizacion_fecha = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de Autorización")

    def get_approved_bloques(self):
        return Bloque.objects.filter(
            examenes__notas__estudiante=self,
            examenes__notas__aprobado=True,
            examenes__tipo_examen__in=[Examen.FINAL_SINC, Examen.FINAL_VIRTUAL, Examen.EQUIVALENCIA]
        ).distinct()

    def ha_aprobado_bloque(self, bloque):
        return self.notas.filter(
            examen__bloque=bloque,
            examen__tipo_examen__in=[Examen.FINAL_SINC, Examen.FINAL_VIRTUAL, Examen.EQUIVALENCIA],
            aprobado=True
        ).exists()

    class Meta:
        ordering = ['apellido', 'nombre']
        indexes = [
            models.Index(fields=['apellido', 'nombre'], name='idx_estudiante_nombre'),
            models.Index(fields=['estatus'], name='idx_estudiante_estatus'),
            models.Index(fields=['is_active'], name='idx_estudiante_active'),
            models.Index(fields=['ciudad'], name='idx_estudiante_ciudad'),
            models.Index(fields=['email'], name='idx_estudiante_email'),
        ]
        verbose_name = "Estudiante"
        verbose_name_plural = "Estudiantes"

    def __str__(self): return f"{self.apellido}, {self.nombre} ({self.dni})"

class Bloque(TimeStamped):
    programa = models.ForeignKey(Programa, on_delete=models.CASCADE, related_name="bloques")
    nombre = models.CharField(max_length=120)
    correlativas = models.ManyToManyField('self', symmetrical=False, blank=True, related_name='es_correlativa_de')

    def clean(self):
        super().clean()
        if self.pk:
            if self.correlativas.filter(pk=self.pk).exists():
                raise ValidationError("Un bloque no puede ser correlativo de sí mismo.")
            
            visitados = set()
            for corr in self.correlativas.all():
                cola = [corr]
                while cola:
                    actual = cola.pop(0)
                    if actual.id == self.id:
                        raise ValidationError(f"Dependencia circular detectada: el bloque correlativo '{corr.nombre}' genera un ciclo que requiere este mismo bloque.")
                    if actual.id not in visitados:
                        visitados.add(actual.id)
                        cola.extend(actual.correlativas.all())

    def __str__(self):
        return self.nombre

    class Meta:
        unique_together = ("programa", "nombre")
        ordering = ["id"]

class Modulo(TimeStamped):
    bloque = models.ForeignKey(Bloque, on_delete=models.CASCADE, related_name="modulos")
    nombre = models.CharField(max_length=120)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    es_practica = models.BooleanField(default=False)
    asistencia_requerida_practica = models.PositiveIntegerField(default=80)

    def clean(self):
        super().clean()
        if self.fecha_inicio and self.fecha_fin and self.fecha_fin < self.fecha_inicio:
            raise ValidationError("La fecha de fin no puede ser anterior a la fecha de inicio.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre

    class Meta:
        unique_together = ("bloque", "nombre")
        ordering = ["id"]


class HorarioCursada(TimeStamped):
    LUNES = "LUNES"
    MARTES = "MARTES"
    MIERCOLES = "MIERCOLES"
    JUEVES = "JUEVES"
    VIERNES = "VIERNES"
    SABADO = "SABADO"
    DOMINGO = "DOMINGO"
    DIAS = [
        (LUNES, "Lunes"),
        (MARTES, "Martes"),
        (MIERCOLES, "Miércoles"),
        (JUEVES, "Jueves"),
        (VIERNES, "Viernes"),
        (SABADO, "Sábado"),
        (DOMINGO, "Domingo"),
    ]

    cohorte = models.ForeignKey(Cohorte, on_delete=models.CASCADE, related_name="horarios")
    bloque = models.ForeignKey(Bloque, on_delete=models.CASCADE, related_name="horarios")
    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE, related_name="horarios", null=True, blank=True)
    docente = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="horarios_cursada",
        null=True,
        blank=True,
    )
    dia_semana = models.CharField(max_length=10, choices=DIAS)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()

    class Meta:
        ordering = ["cohorte_id", "bloque_id", "modulo_id", "dia_semana", "hora_inicio"]
        constraints = [
            models.UniqueConstraint(
                fields=["cohorte", "bloque", "modulo", "dia_semana", "hora_inicio", "hora_fin"],
                name="uniq_horario_cursada",
            )
        ]
        indexes = [
            models.Index(fields=["cohorte", "dia_semana"]),
            models.Index(fields=["bloque", "modulo"]),
            models.Index(fields=["docente", "cohorte"]),
        ]

    def clean(self):
        if self.hora_fin <= self.hora_inicio:
            raise ValidationError("La hora de fin debe ser mayor que la hora de inicio.")
        if self.cohorte_id and self.bloque_id and self.cohorte.bloque_id and self.cohorte.bloque_id != self.bloque_id:
            raise ValidationError("El bloque del horario no coincide con el bloque de la cohorte.")
        if self.modulo_id and self.modulo.bloque_id != self.bloque_id:
            raise ValidationError("El módulo debe pertenecer al bloque seleccionado.")

        if not self.modulo_id:
            qs = HorarioCursada.objects.filter(
                cohorte=self.cohorte,
                bloque=self.bloque,
                modulo__isnull=True,
                dia_semana=self.dia_semana,
                hora_inicio=self.hora_inicio,
                hora_fin=self.hora_fin,
            )
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError("Ya existe un horario de cursada idéntico (sin módulo) para esta cohorte y bloque.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

class Examen(TimeStamped):
    PARCIAL = "PARCIAL"
    RECUP = "RECUP"
    FINAL_VIRTUAL = "FINAL_VIRTUAL"
    FINAL_SINC = "FINAL_SINC"
    EQUIVALENCIA = "EQUIVALENCIA"
    TIPOS_EXAMEN = [
        (PARCIAL, "Parcial"), 
        (RECUP, "Recuperatorio"), 
        (FINAL_VIRTUAL, "Final Virtual"), 
        (FINAL_SINC, "Final Sincrónico"),
        (EQUIVALENCIA, "Equivalencia"),
    ]

    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE, related_name="examenes", null=True, blank=True)
    bloque = models.ForeignKey(Bloque, on_delete=models.CASCADE, related_name="examenes", null=True, blank=True)
    tipo_examen = models.CharField(max_length=15, choices=TIPOS_EXAMEN)
    fecha = models.DateField(null=True, blank=True)
    peso = models.DecimalField(max_digits=5, decimal_places=2, default=1.00)

    def __str__(self):
        if self.modulo:
            return f"{self.tipo_examen} - {self.modulo.nombre}"
        elif self.bloque:
            return f"{self.tipo_examen} - {self.bloque.nombre}"
        return f"{self.tipo_examen}"

    def clean(self):
        if self.modulo and self.bloque:
            raise ValidationError("Un examen no puede pertenecer a un módulo y a un bloque a la vez.")
        if not self.modulo and not self.bloque:
            raise ValidationError("Un examen debe estar asociado a un módulo o a un bloque.")
        if self.modulo and self.tipo_examen not in [self.PARCIAL, self.RECUP]:
            raise ValidationError("Los exámenes de módulo solo pueden ser Parcial o Recuperatorio.")
        if self.bloque and self.tipo_examen not in [self.FINAL_VIRTUAL, self.FINAL_SINC, self.EQUIVALENCIA]:
            raise ValidationError("Los exámenes de bloque solo pueden ser Final Virtual, Final Sincrónico o Equivalencia.")

    class Meta:
        indexes = [
            models.Index(fields=["modulo", "tipo_examen"]),
            models.Index(fields=["bloque", "tipo_examen"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(peso__gt=0),
                name='check_peso_positivo'
            ),
            models.UniqueConstraint(
                fields=['modulo', 'tipo_examen'],
                name='uniq_examen_modulo_tipo'
            ),
            models.UniqueConstraint(
                fields=['bloque', 'tipo_examen'],
                name='uniq_examen_bloque_tipo'
            )
        ]

class Inscripcion(TimeStamped):
    PREINSCRIPTO = "PREINSCRIPTO"
    CURSANDO = "CURSANDO"
    INACTIVO = "INACTIVO"
    LIBRE = "LIBRE"
    PAUSADO = "PAUSADO"
    EGRESADO = "EGRESADO"
    APROBADO = "APROBADO"
    DESAPROBADO = "DESAPROBADO"
    
    ESTADOS = [
        (PREINSCRIPTO, "Preinscripto"),
        (CURSANDO, "Cursando"),
        (INACTIVO, "Inactivo"),
        (LIBRE, "Libre"),
        (PAUSADO, "Pausado"),
        (EGRESADO, "Egresado"),
        (APROBADO, "Aprobado"),
        (DESAPROBADO, "Desaprobado"),
    ]
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name="inscripciones")
    cohorte = models.ForeignKey(Cohorte, on_delete=models.CASCADE, related_name="inscripciones")
    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE, related_name="inscripciones", null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default=PREINSCRIPTO)
    class Meta:
        unique_together = ("estudiante","cohorte", "modulo")
        indexes = [models.Index(fields=["cohorte"])]

class Nota(TimeStamped):
    examen = models.ForeignKey(Examen, on_delete=models.CASCADE, related_name="notas")
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name="notas")
    calificacion = models.DecimalField(max_digits=5, decimal_places=2)
    aprobado = models.BooleanField(default=False)
    fecha_calificacion = models.DateTimeField(null=True, blank=True)
    
    # Campos de equivalencia
    es_equivalencia = models.BooleanField(default=False)
    origen_equivalencia = models.CharField(max_length=255, blank=True)
    fecha_ref_equivalencia = models.DateField(null=True, blank=True)
    
    # Nuevos campos para control de secuencia de evaluación
    intento = models.PositiveIntegerField(
        default=1,
        help_text="Número de intento para este examen (1, 2, 3...)"
    )
    es_nota_definitiva = models.BooleanField(
        default=False,
        help_text="True si es la nota final que cuenta para aprobar el bloque"
    )
    habilitado_por = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='habilita_a',
        help_text="Nota de Final Virtual que habilitó este Final Sincrónico"
    )

    class Meta:
        ordering = ['-fecha_calificacion']
        indexes = [
            models.Index(fields=["examen", "estudiante"]),
            models.Index(fields=["examen", "estudiante", "intento"]),
            models.Index(fields=["estudiante", "es_nota_definitiva"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['examen', 'estudiante', 'intento'],
                name='uniq_nota_examen_estudiante_intento'
            ),
            models.UniqueConstraint(
                fields=['examen', 'estudiante'],
                condition=models.Q(es_nota_definitiva=True),
                name='uniq_nota_definitiva_por_examen_estudiante'
            ),
            models.CheckConstraint(
                check=models.Q(calificacion__gte=0) & models.Q(calificacion__lte=10),
                name='check_calificacion_rango_valido'
            )
        ]

    def clean(self):
        tipos_final = [Examen.FINAL_VIRTUAL, Examen.FINAL_SINC, Examen.EQUIVALENCIA]
        if self.es_equivalencia and self.examen and self.examen.tipo_examen not in tipos_final:
            raise ValidationError("La equivalencia solo puede registrarse sobre exámenes de tipo FINAL o EQUIVALENCIA.")
        if self.calificacion is not None:
            deberia_aprobar = self.calificacion >= 6
            if self.aprobado != deberia_aprobar:
                raise ValidationError("El campo 'aprobado' es inconsistente con la calificación ingresada.")
        if self.fecha_calificacion is None:
            self.fecha_calificacion = timezone.now()

    def save(self, *args, **kwargs):
        if self.calificacion is not None:
            self.aprobado = self.calificacion >= 6
        if self.fecha_calificacion is None:
            self.fecha_calificacion = timezone.now()
        super().save(*args, **kwargs)

class Asistencia(TimeStamped):
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE, related_name="asistencias")
    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE, related_name="asistencias")
    fecha = models.DateField()
    presente = models.BooleanField(default=False)
    archivo_origen = models.CharField(max_length=200, blank=True)
    class Meta:
        unique_together = ("estudiante","modulo","fecha")
        indexes = [
            models.Index(fields=["modulo", "fecha"]),
            models.Index(fields=["estudiante", "modulo"]),
        ]

# --- Users & Roles helpers ---
class UserProfile(models.Model):
    """
    Perfil extendido para usuarios del sistema
    Proporciona funcionalidad adicional como cambio de contraseña obligatorio
    y gestión de envío de credenciales por email.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    must_change_password = models.BooleanField(
        default=True,
        help_text="Si está activo, el usuario debe cambiar la contraseña al iniciar sesión."
    )
    temp_password = models.CharField(
        max_length=128,
        blank=True,
        null=True,
        help_text="Contraseña temporal para envío por email (se borra después del primer login o envío)"
    )
    credentials_sent_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Fecha y hora en que se enviaron las credenciales por email"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Perfil de Usuario"
        verbose_name_plural = "Perfiles de Usuario"

    def __str__(self):
        return f"Profile({self.user.username})"

class NivelacionDigital(TimeStamped):
    """
    Test de nivelación para el curso de Habilidades Digitales.
    Determina si el estudiante va al Módulo 1 o Módulo 2.
    """
    estudiante = models.OneToOneField(Estudiante, on_delete=models.CASCADE, related_name="nivelacion_digital")
    token = models.CharField(max_length=100, unique=True, db_index=True)
    completado = models.BooleanField(default=False)
    fecha_completado = models.DateTimeField(null=True, blank=True)
    puntaje = models.PositiveIntegerField(default=0)
    total_preguntas = models.PositiveIntegerField(default=10)
    respuestas_json = models.JSONField(null=True, blank=True, help_text="Respuestas detalladas del estudiante")
    
    # Lógica de asignación sugerida
    modulo_asignado = models.ForeignKey('Modulo', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = "Nivelación Digital"
        verbose_name_plural = "Nivelaciones Digitales"

    def __str__(self):
        return f"Nivelación {self.estudiante.apellido} ({self.puntaje}/{self.total_preguntas})"


class PreinscripcionTerciario(TimeStamped):

    LOCALIDAD_CHOICES = [
        ('ushuaia', 'Ushuaia'),
        ('rg_sur', 'Río Grande - Margen Sur'),
        ('rg_norte', 'Río Grande - Margen Norte'),
        ('tolhuin', 'Tolhuin'),
        ('zona_rural', 'Zona rural (Por ej. Estancia Cullen)'),
        ('otras', 'Otras Ciudades'),
    ]
    SEXO_CHOICES = [('F', 'Femenino'), ('M', 'Masculino'), ('O', 'Otro')]
    SECUNDARIA_CHOICES = [('si', 'Sí'), ('no', 'No'), ('cursando', 'Cursando el último año')]
    DISCAPACIDAD_CHOICES = [
        ('visual', 'Visual'), ('auditiva', 'Auditiva'), ('intelectual', 'Intelectual'),
        ('motora', 'Motora'), ('tea', 'Trastornos de Espectro Autista'),
        ('otra', 'Otra discapacidad'), ('multiple', 'Más de una discapacidad'),
    ]
    APOYO_CHOICES = [('estatal', 'Sector Estatal'), ('privado', 'Sector Privado'), ('ninguno', 'Ninguno')]
    ESTADO_CHOICES = [('pendiente', 'Pendiente'), ('aprobada', 'Aprobada'), ('rechazada', 'Rechazada')]

    # Datos personales
    email = models.EmailField()
    apellido = models.CharField(max_length=120, default="")
    nombre = models.CharField(max_length=120, default="")
    dni = models.CharField(max_length=15)
    cuil = models.CharField(max_length=15)
    sexo = models.CharField(max_length=1, choices=SEXO_CHOICES)
    celular = models.CharField(max_length=20)
    fecha_nacimiento = models.DateField()
    localidad_nacimiento = models.CharField(max_length=100)
    provincia_nacimiento = models.CharField(max_length=100)
    nacionalidad = models.CharField(max_length=100)
    domicilio = models.CharField(max_length=200)
    localidad = models.CharField(max_length=20, choices=LOCALIDAD_CHOICES)

    # Datos académicos
    finalizo_secundaria = models.CharField(max_length=10, choices=SECUNDARIA_CHOICES)
    posee_estudios_superiores = models.BooleanField(default=False)
    estudios_superiores_finalizado = models.BooleanField(null=True, blank=True)
    estudios_superiores_carrera = models.CharField(max_length=200, blank=True)

    # Datos tecnológicos
    posee_pc = models.BooleanField()
    posee_internet = models.BooleanField()

    # Datos complementarios
    pueblo_originario = models.BooleanField(default=False)
    posee_discapacidad = models.BooleanField(default=False)
    tipo_discapacidad = models.CharField(max_length=20, choices=DISCAPACIDAD_CHOICES, blank=True)
    posee_cud = models.BooleanField(null=True, blank=True)
    apoyo_inclusion = models.CharField(max_length=10, choices=APOYO_CHOICES, blank=True)
    requiere_apoyo_especifico = models.BooleanField(null=True, blank=True)
    descripcion_apoyo = models.TextField(blank=True)

    # Documentación
    dni_digitalizado = models.FileField(upload_to='terciario/dni/', null=True, blank=True)
    titulo_digitalizado = models.FileField(upload_to='terciario/titulo/', null=True, blank=True)

    # Gestión
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    observaciones = models.TextField(blank=True)
    correo_bienvenida_at = models.DateTimeField(null=True, blank=True, help_text="Fecha/hora en que se envió el correo de bienvenida")
    correo_correccion_at = models.DateTimeField(null=True, blank=True, help_text="Fecha/hora en que se envió el correo de corrección de Hoja de Ruta")
    hd_inscripcion = models.ForeignKey(
        'Inscripcion', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='preinscripcion_terciario'
    )

    class Meta:
        verbose_name = "Preinscripción Terciario"
        verbose_name_plural = "Preinscripciones Terciario"
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['dni'], name='uniq_preinscripcion_dni'),
        ]

    @property
    def apellido_nombre(self):
        return f"{self.apellido}, {self.nombre}".strip(", ")

    def __str__(self):
        return f"{self.apellido}, {self.nombre} - {self.dni} ({self.get_estado_display()})"



class ConfiguracionPreinscripcionTerciario(models.Model):
    """Singleton — usar siempre id=1."""
    preinscripcion_abierta = models.BooleanField(default=False)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    mensaje_cierre = models.CharField(
        max_length=300,
        default="Las preinscripciones están cerradas en este momento.",
        blank=True,
    )
    hd_cohorte = models.ForeignKey(
        'Cohorte', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='config_terciario',
        help_text="Cohorte de HD Módulo 2 donde se inscriben los aprobados",
    )
    programa_terciario = models.ForeignKey(
        'Programa',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='configuracion_preinscripcion',
        help_text="Programa terciario al que aplica esta configuración"
    )

    class Meta:
        verbose_name = "Configuración Preinscripción Terciario"

    def __str__(self):
        return "Configuración preinscripción terciario"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj


class ConfiguracionPreinscripcionVideojuegos(models.Model):
    """Singleton — usar siempre id=1."""
    preinscripcion_abierta = models.BooleanField(default=False)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    mensaje_cierre = models.CharField(
        max_length=300,
        default="Las preinscripciones de Videojuegos están cerradas en este momento.",
        blank=True,
    )
    cohorte_activa = models.ForeignKey(
        'Cohorte', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='config_videojuegos',
        help_text="Cohorte activa de Videojuegos donde se inscriben los aprobados",
    )

    class Meta:
        verbose_name = "Configuración Preinscripción Videojuegos"

    def __str__(self):
        return "Configuración preinscripción videojuegos"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj

