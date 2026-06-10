# backend/academia/urls.py
from django.contrib import admin
from django.urls import path

from academia.api import api as api_v2
from core.views import protected_media_view

# La API principal es Django Ninja, montada en /api/v2/.
# El antiguo layer DRF (viewsets/vistas/router) fue eliminado por estar desenrutado.
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v2/", api_v2.urls),
    # Ruta segura: control de acceso a archivos subidos
    path("media/<path:path>", protected_media_view, name="protected_media"),
]
