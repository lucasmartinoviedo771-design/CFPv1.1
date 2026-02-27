# backend/core/serializers.py
import re
from rest_framework import serializers
from django.db.models import Q, Avg, Count
from .models import (
    Resolucion, Estudiante, Programa, Bloque, Modulo, Examen, Nota, Asistencia, 
    Inscripcion, BloqueDeFechas, SemanaConfig, Cohorte
)
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import User, Group
from django.core.mail import send_mail
from django.conf import settings
from .roles import list_roles
from .utils.estudiante_normalization import (
    normalize_dni_digits,
    normalize_country_with_other,
    normalize_sexo,
    normalize_spaces,
    to_title_case,
    to_upper,
)

class EstudianteSerializer(serializers.ModelSerializer):
    def to_internal_value(self, data):
        mutable = dict(data)

        if "apellido" in mutable:
            mutable["apellido"] = to_upper(mutable.get("apellido"))
        if "nombre" in mutable:
            mutable["nombre"] = to_title_case(mutable.get("nombre"))
        if "dni" in mutable:
            mutable["dni"] = normalize_dni_digits(mutable.get("dni"))
        if "email" in mutable and mutable.get("email") is not None:
            mutable["email"] = normalize_spaces(mutable.get("email")).lower()

        if "sexo" in mutable:
            mutable["sexo"] = normalize_sexo(mutable.get("sexo"))

        if "pais_nacimiento" in mutable:
            pais, otro = normalize_country_with_other(mutable.get("pais_nacimiento"))
            mutable["pais_nacimiento"] = pais
            if otro and not normalize_spaces(mutable.get("pais_nacimiento_otro")):
                mutable["pais_nacimiento_otro"] = otro
        if "nacionalidad" in mutable:
            nac, otro = normalize_country_with_other(mutable.get("nacionalidad"))
            mutable["nacionalidad"] = nac
            if otro and not normalize_spaces(mutable.get("nacionalidad_otra")):
                mutable["nacionalidad_otra"] = otro

        for field in [
            "pais_nacimiento_otro",
            "nacionalidad_otra",
            "lugar_nacimiento",
            "domicilio",
            "ciudad",
            "barrio",
            "lugar_trabajo",
        ]:
            if field in mutable:
                mutable[field] = to_title_case(mutable.get(field))

        return super().to_internal_value(mutable)

    trayectos = serializers.SerializerMethodField()

    def get_trayectos(self, obj):
        return list(obj.inscripciones.values_list('cohorte__programa__nombre', flat=True).distinct())

    class Meta:
        model = Estudiante
        fields = "__all__"

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']

class SemanaConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SemanaConfig
        fields = ['id', 'tipo', 'orden']

class BloqueDeFechasSerializer(serializers.ModelSerializer):
    semanas_config = SemanaConfigSerializer(many=True, read_only=True)

    class Meta:
        model = BloqueDeFechas
        fields = ['id', 'nombre', 'descripcion', 'semanas_config']

class ResolucionSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Resolucion"""
    class Meta:
        model = Resolucion
        fields = ['id', 'numero', 'nombre', 'fecha_publicacion', 'vigente', 'observaciones', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class ProgramaSerializer(serializers.ModelSerializer):
    resolucion = ResolucionSerializer(read_only=True)
    resolucion_id = serializers.PrimaryKeyRelatedField(
        queryset=Resolucion.objects.all(), source='resolucion', write_only=True, required=False, allow_null=True
    )
    
    class Meta:
        model = Programa
        fields = ['id', 'codigo', 'nombre', 'activo', 'requiere_titulo_secundario', 'resolucion', 'resolucion_id']


class CohorteBloqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bloque
        fields = ['id', 'nombre']

class CohorteSerializer(serializers.ModelSerializer):
    programa = ProgramaSerializer(read_only=True)
    bloque = CohorteBloqueSerializer(read_only=True)
    bloque_fechas = BloqueDeFechasSerializer(read_only=True)
    programa_id = serializers.PrimaryKeyRelatedField(
        queryset=Programa.objects.all(), source='programa', write_only=True
    )
    bloque_id = serializers.PrimaryKeyRelatedField(
        queryset=Bloque.objects.all(), source='bloque', write_only=True, required=False, allow_null=True
    )
    bloque_fechas_id = serializers.PrimaryKeyRelatedField(
        queryset=BloqueDeFechas.objects.all(), source='bloque_fechas', write_only=True
    )

    class Meta:
        model = Cohorte
        fields = [
            'id',
            'nombre',
            'fecha_inicio',
            'fecha_fin',
            'programa',
            'bloque',
            'bloque_fechas',
            'programa_id',
            'bloque_id',
            'bloque_fechas_id',
        ]

class ExamenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Examen
        fields = "__all__"

class SimpleBloqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bloque
        fields = ['id', 'nombre']

class ModuloSerializer(serializers.ModelSerializer):
    bloque = SimpleBloqueSerializer(read_only=True)
    bloque_id = serializers.PrimaryKeyRelatedField(
        queryset=Bloque.objects.all(), source='bloque', write_only=True
    )

    def validate(self, attrs):
        # Blindaje adicional: no aceptar fechas en módulos por ninguna vía de escritura.
        if hasattr(self, "initial_data"):
            if "fecha_inicio" in self.initial_data or "fecha_fin" in self.initial_data:
                raise serializers.ValidationError(
                    "No se permite definir fechas en módulos. Use Cohortes/Calendario."
                )
        return super().validate(attrs)

    class Meta:
        model = Modulo
        fields = ['id', 'nombre', 'fecha_inicio', 'fecha_fin', 'es_practica', 'asistencia_requerida_practica', 'bloque', 'bloque_id']

class BloqueDetailSerializer(serializers.ModelSerializer):
    modulos = ModuloSerializer(many=True, read_only=True)
    examenes_finales = serializers.SerializerMethodField()

    class Meta:
        model = Bloque
        fields = ['id', 'nombre', 'modulos', 'examenes_finales']
    
    def get_examenes_finales(self, obj):
        qs = Examen.objects.filter(bloque=obj, tipo_examen__in=['FINAL_VIRTUAL', 'FINAL_SINC', 'EQUIVALENCIA'])
        return ExamenSerializer(qs, many=True).data

class ProgramaDetailSerializer(serializers.ModelSerializer):
    bloques = BloqueDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Programa
        fields = ['id', 'codigo', 'nombre', 'activo', 'requiere_titulo_secundario', 'bloques']

class BloqueSerializer(serializers.ModelSerializer):
    programa_id = serializers.PrimaryKeyRelatedField(
        queryset=Programa.objects.all(), source='programa', write_only=True
    )
    
    class Meta:
        model = Bloque
        fields = ['id', 'nombre', 'programa', 'programa_id', 'correlativas']
        extra_kwargs = {
            'programa': {'read_only': True}
        }

class InscripcionSerializer(serializers.ModelSerializer):
    estudiante = EstudianteSerializer(read_only=True)
    cohorte = CohorteSerializer(read_only=True)
    modulo = ModuloSerializer(read_only=True, allow_null=True)
    estudiante_id = serializers.PrimaryKeyRelatedField(
        queryset=Estudiante.objects.all(), source='estudiante', write_only=True
    )
    cohorte_id = serializers.PrimaryKeyRelatedField(
        queryset=Cohorte.objects.all(), source='cohorte', write_only=True
    )
    modulo_id = serializers.PrimaryKeyRelatedField(
        queryset=Modulo.objects.all(), source='modulo', write_only=True, allow_null=True
    )

    class Meta:
        model = Inscripcion
        fields = ['id', 'estudiante', 'cohorte', 'modulo', 'estudiante_id', 'cohorte_id', 'modulo_id', 'estado', 'created_at', 'updated_at']

    @staticmethod
    def _modulo_nivel(modulo: Modulo, modulos_bloque):
        """
        Determina nivel de módulo:
        1) intenta parsear del nombre (Módulo 1 / Módulo I / Modulo II)
        2) fallback al orden por id dentro del bloque (1-based)
        """
        nombre = (modulo.nombre or "").strip().upper()
        # Captura "MODULO 2", "MÓDULO II", etc.
        m = re.search(r"M[ÓO]DULO\s*([0-9]+|[IVXLCDM]+)\b", nombre)
        if m:
            token = m.group(1)
            if token.isdigit():
                return int(token)
            roman_map = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
            total = 0
            prev = 0
            for ch in reversed(token):
                val = roman_map.get(ch, 0)
                if val < prev:
                    total -= val
                else:
                    total += val
                    prev = val
            if total > 0:
                return total

        ids = [m.id for m in modulos_bloque]
        try:
            return ids.index(modulo.id) + 1
        except ValueError:
            return 1

    def validate(self, attrs):
        attrs = super().validate(attrs)

        estudiante = attrs.get("estudiante") or getattr(self.instance, "estudiante", None)
        modulo = attrs.get("modulo") or getattr(self.instance, "modulo", None)

        # Si la inscripción no apunta a módulo, no aplica correlatividad de módulos.
        if not estudiante or not modulo:
            return attrs

        modulos_bloque = list(Modulo.objects.filter(bloque_id=modulo.bloque_id).order_by("id"))
        nivel_actual = self._modulo_nivel(modulo, modulos_bloque)
        if nivel_actual <= 1:
            return attrs

        # Módulos aprobados por el estudiante en este bloque (según notas aprobadas).
        aprobados = set(
            Nota.objects.filter(
                estudiante=estudiante,
                examen__modulo__bloque_id=modulo.bloque_id,
                aprobado=True,
            ).values_list("examen__modulo_id", flat=True)
        )

        faltantes = []
        for m in modulos_bloque:
            nivel_m = self._modulo_nivel(m, modulos_bloque)
            if nivel_m < nivel_actual and m.id not in aprobados:
                faltantes.append(m.nombre)

        if faltantes:
            raise serializers.ValidationError(
                {
                    "modulo_id": (
                        f"No se puede inscribir en '{modulo.nombre}' sin aprobar antes: "
                        f"{', '.join(faltantes)}."
                    )
                }
            )

        return attrs

class NotaSerializer(serializers.ModelSerializer):
    examen_modulo_nombre = serializers.CharField(source="examen.modulo.nombre", read_only=True, allow_null=True)
    examen_modulo_id = serializers.IntegerField(source="examen.modulo.id", read_only=True, allow_null=True)
    examen_bloque_nombre = serializers.SerializerMethodField()
    examen_programa_nombre = serializers.SerializerMethodField()
    examen_tipo_examen = serializers.CharField(source="examen.tipo_examen", read_only=True)
    examen_fecha = serializers.DateField(source="examen.fecha", read_only=True)

    def get_examen_bloque_nombre(self, obj):
        if obj.examen.bloque:
            return obj.examen.bloque.nombre
        elif obj.examen.modulo and obj.examen.modulo.bloque:
            return obj.examen.modulo.bloque.nombre
        return None

    def get_examen_programa_nombre(self, obj):
        bloque = None
        if obj.examen.bloque:
            bloque = obj.examen.bloque
        elif obj.examen.modulo and obj.examen.modulo.bloque:
            bloque = obj.examen.modulo.bloque
        
        if bloque and bloque.programa:
            return bloque.programa.nombre
        return None

    class Meta:
        model = Nota
        fields = (
            'id', 'created_at', 'updated_at',
            'examen', 'estudiante', 'calificacion', 'aprobado', 'fecha_calificacion',
            'es_equivalencia', 'origen_equivalencia', 'fecha_ref_equivalencia',
            'examen_modulo_nombre',
            'examen_modulo_id',
            'examen_bloque_nombre',
            'examen_programa_nombre',
            'examen_tipo_examen',
            'examen_fecha',
            'intento', 'es_nota_definitiva',
        )
    def validate(self, data):
        # Implement rounding for calificacion
        calificacion = data.get("calificacion")
        if calificacion is not None:
            data["calificacion"] = round(calificacion)

        # Get examen and estudiante from incoming data or the existing instance
        examen = data.get("examen") or getattr(self.instance, "examen", None)
        estudiante = data.get("estudiante") or getattr(self.instance, "estudiante", None)

        # Equivalencia solo sobre FINAL
        es_equivalencia = data.get("es_equivalencia", getattr(self.instance, "es_equivalencia", False))
        if es_equivalencia and examen and examen.tipo_examen not in [Examen.FINAL_VIRTUAL, Examen.FINAL_SINC]:
            raise serializers.ValidationError("La equivalencia solo puede registrarse sobre exámenes FINAL.")

        # Validation: Only one approved grade per exam and student
        if data.get("aprobado"):
            if examen and estudiante:
                qs = Nota.objects.filter(examen=examen, estudiante=estudiante, aprobado=True)
                if self.instance:
                    qs = qs.exclude(pk=self.instance.pk)
                if qs.exists():
                    raise serializers.ValidationError("Ya existe una nota aprobada para este examen y estudiante.")

        # calificacion/aprobado coherentes
        if data.get("aprobado") and data.get("calificacion", 0) < 6:
            raise serializers.ValidationError("Si 'aprobado=True', la calificación debe ser >= 6.")

        from django.utils import timezone
        if not data.get("fecha_calificacion") and not getattr(self.instance, "fecha_calificacion", None):
            data["fecha_calificacion"] = timezone.now()

        return data

class AsistenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asistencia
        fields = "__all__"


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Contraseña actual inválida.')
        return value

    def validate_new_password(self, value):
        validate_password(value)
        return value


class AssignRoleSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    role_name = serializers.ChoiceField(choices=[(r, r) for r in list_roles()])

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.SlugRelatedField(many=True, slug_field='name', queryset=Group.objects.all())
    password = serializers.CharField(write_only=True, required=False)
    password2 = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'groups', 'password', 'password2']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        if 'password' in data and 'password2' in data and data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': "Las contraseñas no coinciden."})
        if 'password' in data:
            validate_password(data['password'])
        return data

    def create(self, validated_data):
        groups_data = validated_data.pop('groups', [])
        password = validated_data.pop('password', None)
        validated_data.pop('password2', None) # Remove password2 if present

        # Generate password if not provided
        generated_password = None
        if not password:
            password = User.objects.make_random_password()
            generated_password = password

        # Create user instance safely
        user = User.objects.create(**validated_data)
        
        # Set password
        user.set_password(password)
        user.save()
        
        # Set groups
        if groups_data:
            user.groups.set(groups_data)

        # Send email if password was generated
        if generated_password and user.email:
            try:
                send_mail(
                    subject='Bienvenido al sistema CFP - Tus credenciales',
                    message=f'Hola {user.first_name or user.username},\n\n'
                            f'Se ha creado tu cuenta en el sistema de Gestión Académica CFP.\n\n'
                            f'Tus credenciales de acceso son:\n'
                            f'Usuario: {user.username}\n'
                            f'Contraseña: {generated_password}\n\n'
                            f'Por favor, ingresa y cambia tu contraseña lo antes posible.',
                    from_email=None, # Uses DEFAULT_FROM_EMAIL
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception as e:
                # Log error but don't fail the request
                print(f"Error enviando email a {user.email}: {e}")

        return user

    def update(self, instance, validated_data):
        groups_data = validated_data.pop('groups', None)
        password = validated_data.pop('password', None)
        validated_data.pop('password2', None) # Remove password2

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)
        instance.save()

        if groups_data is not None:
            instance.groups.set(groups_data)

        return instance
