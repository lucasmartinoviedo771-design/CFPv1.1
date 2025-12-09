# backend/academia/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
# from core.auth import EmailOrUsernameTokenObtainPairView
from academia.api import api as api_v2
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from core.views import (
    EstudianteViewSet, ProgramaViewSet, BloqueViewSet, ModuloViewSet, ExamenViewSet, NotaViewSet, KPIViewSet, InscripcionViewSet, ImportInscripcionesViewSet, ImportAsistenciaViewSet, ImportNotasViewSet, DashboardStatsView, UserView, EstructuraProgramaView, ChangePasswordView,
    BloqueDeFechasViewSet, SemanaConfigViewSet, CohorteViewSet, HistoricoCursoView, LogoutView, UserViewSet, GroupViewSet,
    AnalyticsEnrollmentsView, AnalyticsAttendanceView, AnalyticsGradesView, AnalyticsDropoutView, AnalyticsGraduatesView,
    CoursesGraphView
)

router = DefaultRouter()
# DRF desactivado: API principal es /api/v2 con Django Ninja

urlpatterns = [
    path("admin/", admin.site.urls),
    # Nueva API Django Ninja (convivencia en /api/v2/)
    path("api/v2/", api_v2.urls),
]
