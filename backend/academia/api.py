from ninja import NinjaAPI

from core.api import (
    health_router,
    estudiantes_router,
    programas_router,
    bloques_router,
    modulos_router,
    inscripciones_router,
    examenes_router,
    analytics_router,
)
from core.api.auth import jwt_auth

api = NinjaAPI(
    title="CFP API v2",
    description="API del CFP migrada a Django Ninja (con convivencia DRF).",
    version="2.0.0",
    urls_namespace="api-v2",
    auth=jwt_auth,
)

# Routers registrados. Se completaran gradualmente con logica real.
api.add_router("/health", health_router, auth=None)
api.add_router("/estudiantes", estudiantes_router)
api.add_router("/programas", programas_router)
api.add_router("/bloques", bloques_router)
api.add_router("/modulos", modulos_router)
api.add_router("/inscripciones", inscripciones_router)
api.add_router("/examenes", examenes_router)
api.add_router("/analytics", analytics_router)
