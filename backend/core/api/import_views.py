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


class ImportInscripcionesViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsInAGroup]

    def create(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Create a temporary directory if it doesn't exist
        tmp_dir = os.path.join(settings.BASE_DIR, 'tmp')
        os.makedirs(tmp_dir, exist_ok=True)

        fs = FileSystemStorage(location=tmp_dir)
        filename = fs.save(file_obj.name, file_obj)
        file_path = fs.path(filename)
        
        output = StringIO()
        try:
            call_command('import_inscripciones', f'--file={file_path}', stdout=output)
            result = json.loads(output.getvalue())
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            os.remove(file_path)

class ImportAsistenciaViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsInAGroup]

    def create(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Create a temporary directory if it doesn't exist
        tmp_dir = os.path.join(settings.BASE_DIR, 'tmp_asistencia')
        os.makedirs(tmp_dir, exist_ok=True)

        fs = FileSystemStorage(location=tmp_dir)
        filename = fs.save(file_obj.name, file_obj)
        
        output = StringIO()
        try:
            call_command('import_asistencia', f'--dir={tmp_dir}', stdout=output)
            result = json.loads(output.getvalue())
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            # Clean up the temporary file and directory
            file_path = fs.path(filename)
            os.remove(file_path)
            os.rmdir(tmp_dir)

class ImportNotasViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsInAGroup]

    def create(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Create a temporary directory if it doesn't exist
        tmp_dir = os.path.join(settings.BASE_DIR, 'tmp')
        os.makedirs(tmp_dir, exist_ok=True)

        fs = FileSystemStorage(location=tmp_dir)
        filename = fs.save(file_obj.name, file_obj)
        file_path = fs.path(filename)
        
        output = StringIO()
        try:
            call_command('import_notas', f'--file={file_path}', stdout=output)
            result = json.loads(output.getvalue())
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            os.remove(file_path)
