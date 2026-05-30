# backend/academia/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
# from core.auth import EmailOrUsernameTokenObtainPairView
from academia.api import api as api_v2
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from core.api.viewsets import (
    EstudianteViewSet, ProgramaViewSet, BloqueViewSet, ModuloViewSet, ExamenViewSet, NotaViewSet, InscripcionViewSet, UserView, ChangePasswordView,
    BloqueDeFechasViewSet, SemanaConfigViewSet, CohorteViewSet, HistoricoCursoView, LogoutView, UserViewSet, GroupViewSet
)
from core.api.analytics_views import (
    DashboardStatsView, EstructuraProgramaView, AnalyticsEnrollmentsView, AnalyticsAttendanceView, AnalyticsGradesView, AnalyticsDropoutView, AnalyticsGraduatesView, CoursesGraphView, KPIViewSet
)
from core.api.import_views import (
    ImportInscripcionesViewSet, ImportAsistenciaViewSet, ImportNotasViewSet
)

from core.views import protected_media_view

router = DefaultRouter()
# DRF desactivado: API principal es /api/v2 con Django Ninja

urlpatterns = [
    path("admin/", admin.site.urls),
    # Nueva API Django Ninja (convivencia en /api/v2/)
    path("api/v2/", api_v2.urls),
    # RUTA SEGURA: Control de acceso a archivos subidos
    path("media/<path:path>", protected_media_view, name="protected_media"),
]
