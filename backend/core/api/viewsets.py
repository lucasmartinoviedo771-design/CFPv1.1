# backend/core/views.py
from rest_framework import viewsets, permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta, datetime
from django.db import transaction
from django.db.models import Avg, Count, Q, IntegerField, Prefetch
from django.db.models.functions import Coalesce, TruncMonth, TruncWeek, Round, Cast
from django.core.management import call_command
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.utils.dateparse import parse_date
from django.utils import timezone
from django.contrib.auth.models import User, Group
from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
import os
import json
from io import StringIO

from .models import (
    Estudiante, Programa, Bloque, Modulo, Examen, Nota, Asistencia, Inscripcion,
    BloqueDeFechas, SemanaConfig, Cohorte
)
from .serializers import (
    ProgramaSerializer,
    ProgramaDetailSerializer,
    BloqueDetailSerializer,
    CohorteSerializer,
    EstudianteSerializer,
    InscripcionSerializer,
    BloqueSerializer,
    ModuloSerializer,
    ExamenSerializer,
    NotaSerializer,
    AsistenciaSerializer,
    BloqueDeFechasSerializer,
    SemanaConfigSerializer,
    ChangePasswordSerializer,
    UserSerializer,
    GroupSerializer
)
from .roles import can_assign_role, list_roles, IsInAGroup
from .filters import EstudianteFilter


class UserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        groups = list(request.user.groups.values_list('name', flat=True))
        must_change = getattr(getattr(request.user, 'profile', None), 'must_change_password', False)
        return Response({'username': request.user.username, 'groups': groups, 'must_change_password': must_change})


class ChangePasswordView(generics.UpdateAPIView):
    """
    An endpoint for changing password.
    """
    serializer_class = ChangePasswordSerializer
    model = User
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self, queryset=None):
        obj = self.request.user
        return obj

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            # Check old password
            if not self.object.check_password(serializer.data.get("current_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            # set_password also hashes the password that the user will get
            self.object.set_password(serializer.data.get("new_password"))
            self.object.save()

            # Marcar que ya no es necesario cambiar la contraseña
            if hasattr(self.object, 'profile'):
                self.object.profile.must_change_password = False
                self.object.profile.save()

            response = {
                'status': 'success',
                'code': status.HTTP_200_OK,
                'message': 'Password updated successfully',
                'data': []
            }

            return Response(response)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HistoricoCursoView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInAGroup]

    def get(self, request, *args, **kwargs):
        return Response({'detail': 'HistoricoCurso endpoint no implementado en esta versión.'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class GroupViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Group.objects.all().order_by('name')
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAdminUser]


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class EstudianteViewSet(viewsets.ModelViewSet):
    queryset = Estudiante.objects.all().order_by("apellido", "nombre")
    serializer_class = EstudianteSerializer
    permission_classes = [permissions.IsAuthenticated, IsInAGroup, permissions.DjangoModelPermissions]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = EstudianteFilter
    ordering_fields = ['dni', 'apellido', 'nombre', 'email', 'ciudad', 'created_at']

    @action(detail=True, methods=['get'])
    def approved_bloques(self, request, pk=None):
        estudiante = self.get_object()
        bloques = estudiante.get_approved_bloques()
        serializer = BloqueSerializer(bloques, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_approve(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'No se proporcionaron IDs.'}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            updated = Estudiante.objects.filter(id__in=ids, estatus='Preinscripto').update(estatus='Regular', updated_at=timezone.now())
            
        return Response({'updated': updated}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        if not (request.user.is_superuser or request.user.groups.filter(name='Admin').exists()):
            return Response({'error': 'Solo administradores pueden realizar esta acción.'}, status=status.HTTP_403_FORBIDDEN)
            
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'No se proporcionaron IDs.'}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            deleted_count, _ = Estudiante.objects.filter(id__in=ids).delete()
            
        return Response({'deleted': deleted_count}, status=status.HTTP_200_OK)

    def perform_destroy(self, instance):
        """En lugar de borrar, cambia el estatus a 'Baja' (soft delete)."""
        instance.estatus = 'Baja'
        instance.save()

class ProgramaViewSet(viewsets.ModelViewSet):
    queryset = Programa.objects.all()
    serializer_class = ProgramaSerializer
    permission_classes = [permissions.IsAuthenticated, IsInAGroup, permissions.DjangoModelPermissions]
    filterset_fields = ["activo", "codigo"]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProgramaDetailSerializer
        return super().get_serializer_class()

class CohorteViewSet(viewsets.ModelViewSet):
    queryset = Cohorte.objects.select_related('programa', 'bloque_fechas').all()
    serializer_class = CohorteSerializer
    permission_classes = [permissions.IsAuthenticated, IsInAGroup, permissions.DjangoModelPermissions]
    filterset_fields = ['programa', 'bloque_fechas']

class BloqueDeFechasViewSet(viewsets.ModelViewSet):
    queryset = BloqueDeFechas.objects.all()
    serializer_class = BloqueDeFechasSerializer
    permission_classes = [permissions.IsAuthenticated, IsInAGroup, permissions.DjangoModelPermissions]

    @action(detail=True, methods=['post'])
    def guardar_secuencia(self, request, pk=None):
        bloque = self.get_object()
        semanas_data = request.data.get('semanas', [])

        try:
            # Atomic transaction to ensure data integrity
            with transaction.atomic():
                # Delete old sequence
                bloque.semanas_config.all().delete()
                # Create new sequence
                for i, semana_data in enumerate(semanas_data):
                    SemanaConfig.objects.create(
                        bloque=bloque,
                        orden=i + 1, # Ensure order is sequential
                        tipo=semana_data.get('tipo')
                    )
            return Response({'status': 'secuencia guardada'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def calendario(self, request, pk=None):
        bloque = self.get_object()
        semanas_config = bloque.semanas_config.all().order_by('orden')
        
        calendario_calculado = []
        current_date = bloque.fecha_inicio
        
        for semana_config in semanas_config:
            # La semana va de lunes a sábado
            while current_date.weekday() > 5: # Si es domingo, avanza al lunes
                current_date += timedelta(days=1)
            
            fecha_inicio_semana = current_date
            fecha_fin_semana = fecha_inicio_semana + timedelta(days=5) # Lunes a Sábado son 6 días

            calendario_calculado.append({
                'orden': semana_config.orden,
                'tipo': semana_config.get_tipo_display(),
                'fecha_inicio': fecha_inicio_semana,
                'fecha_fin': fecha_fin_semana
            })
            
            # Prepara la fecha para la siguiente semana (siguiente lunes)
            current_date = fecha_fin_semana + timedelta(days=2)

        return Response(calendario_calculado)

class SemanaConfigViewSet(viewsets.ModelViewSet):
    queryset = SemanaConfig.objects.all()
    serializer_class = SemanaConfigSerializer
    permission_classes = [permissions.IsAuthenticated, IsInAGroup, permissions.DjangoModelPermissions]
    filterset_fields = ['bloque']

class BloqueViewSet(viewsets.ModelViewSet):
    queryset = Bloque.objects.all()
    serializer_class = BloqueSerializer
    permission_classes = [permissions.IsAuthenticated, IsInAGroup, permissions.DjangoModelPermissions]
    filterset_fields = ["programa"]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return BloqueDetailSerializer
        return super().get_serializer_class()

    @action(detail=True, methods=['get'])
    def verificar_correlativas(self, request, pk=None):
        bloque = self.get_object()
        student_id = request.query_params.get('student_id')

        if not student_id:
            return Response({'error': 'student_id query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            estudiante = Estudiante.objects.get(pk=student_id)
        except Estudiante.DoesNotExist:
            return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        bloques_faltantes = []
        for correlativa in bloque.correlativas.all():
            if not estudiante.ha_aprobado_bloque(correlativa):
                bloques_faltantes.append({
                    'id': correlativa.id,
                    'nombre': correlativa.nombre
                })
        
        if bloques_faltantes:
            return Response({
                'requisitos_cumplidos': False,
                'bloques_faltantes': bloques_faltantes
            })
        
        return Response({'requisitos_cumplidos': True})

class ExamenFilter(filters.FilterSet):
    tipo_examen = filters.BaseInFilter(field_name='tipo_examen', lookup_expr='in')

    class Meta:
        model = Examen
        fields = ['modulo', 'bloque', 'tipo_examen']

class ExamenViewSet(viewsets.ModelViewSet):
    queryset = Examen.objects.all()
    serializer_class = ExamenSerializer
    permission_classes = [permissions.IsAuthenticated, IsInAGroup, permissions.DjangoModelPermissions]
    filter_backends = [DjangoFilterBackend]
    filterset_class = ExamenFilter

class ModuloViewSet(viewsets.ModelViewSet):
    queryset = Modulo.objects.all()
    serializer_class = ModuloSerializer
    permission_classes = [permissions.IsAuthenticated, IsInAGroup, permissions.DjangoModelPermissions]
    filterset_fields = ["bloque", "es_practica"]

class NotaViewSet(viewsets.ModelViewSet):
    queryset = Nota.objects.select_related("examen", "estudiante", "examen__modulo")
    serializer_class = NotaSerializer
    permission_classes = [permissions.IsAuthenticated, IsInAGroup, permissions.DjangoModelPermissions]
    # Allow filtering directly by examen ID to avoid false positives when checking
    # for an existing approved note for a specific exam (used by frontend modal)
    filterset_fields = [
        "examen",  # <-- added
        "examen__modulo",
        "examen__bloque__programa",
        "examen__tipo_examen",
        "estudiante",
        "es_equivalencia",
        "aprobado",
    ]

class AsistenciaViewSet(viewsets.ModelViewSet):
    queryset = Asistencia.objects.select_related("estudiante", "modulo")
    serializer_class = AsistenciaSerializer
    permission_classes = [permissions.IsAuthenticated, IsInAGroup, permissions.DjangoModelPermissions]
    filterset_fields = ["estudiante", "modulo", "fecha", "presente", "archivo_origen", "modulo__bloque"]

class InscripcionViewSet(viewsets.ModelViewSet):
    queryset = Inscripcion.objects.select_related('cohorte__programa', 'cohorte__bloque_fechas', 'modulo__bloque').all()
    serializer_class = InscripcionSerializer
    permission_classes = [permissions.IsAuthenticated, IsInAGroup, permissions.DjangoModelPermissions]
    filterset_fields = ["estudiante", "cohorte", "estado", "cohorte__programa", "modulo", "modulo__bloque"]

# KPIs
class LogoutView(APIView):
    """Blacklists the provided refresh token (SimpleJWT blacklist).
    Allows logout even if access token expired.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response({"detail": "'refresh' is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except Exception:
            return Response({"detail": "Invalid refresh token"}, status=status.HTTP_400_BAD_REQUEST)
        # 205 Reset Content is a common choice to hint client to clear state
        return Response(status=status.HTTP_205_RESET_CONTENT)

