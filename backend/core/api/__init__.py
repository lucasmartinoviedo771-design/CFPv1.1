# Routers agrupados para la API Django Ninja (v2).
from .health import router as health_router
from .estudiantes import router as estudiantes_router
from .programas import router as programas_router
from .bloques import router as bloques_router
from .modulos import router as modulos_router
from .inscripciones import router as inscripciones_router
from .examenes import router as examenes_router
from .analytics import router as analytics_router

__all__ = [
    "health_router",
    "estudiantes_router",
    "programas_router",
    "bloques_router",
    "modulos_router",
    "inscripciones_router",
    "examenes_router",
    "analytics_router",
]
