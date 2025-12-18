# Routers agrupados para la API Django Ninja (v2).
from .health import router as health_router
from .estudiantes import router as estudiantes_router
from .programas import router as programas_router
from .bloques import router as bloques_router
from .modulos import router as modulos_router
from .inscripciones import router as inscripciones_router
from .examenes import router as examenes_router
from .analytics import router as analytics_router
from .bloques_fechas import router as bloques_fechas_router
from .users import router as users_router
from .dashboard import router as dashboard_router
from .imports import router as imports_router
from .historicos import router as historicos_router
from .auth_endpoints import router as auth_endpoints_router
from .user_info import router as user_info_router
from .estructura import router as estructura_router
from .resoluciones import router as resoluciones_router

__all__ = [
    "health_router",
    "estudiantes_router",
    "programas_router",
    "bloques_router",
    "modulos_router",
    "inscripciones_router",
    "examenes_router",
    "analytics_router",
    "bloques_fechas_router",
    "users_router",
    "dashboard_router",
    "imports_router",
    "historicos_router",
    "auth_endpoints_router",
    "user_info_router",
    "estructura_router",
    "resoluciones_router",
]
