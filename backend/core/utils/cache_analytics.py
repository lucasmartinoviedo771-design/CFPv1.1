import hashlib
import logging
from functools import wraps
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)


def cache_analytics(timeout: int = None):
    """
    Decorator para cachear el resultado de un endpoint de analytics en Redis.

    Genera una clave única a partir del nombre de la función y sus parámetros
    (kwargs), de modo que distintas combinaciones de filtros se cacheen por
    separado. El timeout por defecto es settings.ANALYTICS_CACHE_SECONDS.

    Uso:
        @router.get("/enrollments", response=dict)
        @require_authenticated_group
        @cache_analytics()
        def analytics_enrollments(request, programa_id=None, ...):
            ...

    Nota: aplicar DEBAJO de @require_authenticated_group para no cachear
    la verificación de permisos (que debe correr siempre).
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            ttl = timeout if timeout is not None else getattr(
                settings, "ANALYTICS_CACHE_SECONDS", 300
            )

            # Construir clave a partir del nombre de la función + parámetros.
            # Se ignora `request` (no es serializable ni relevante para la clave).
            param_repr = repr(sorted(kwargs.items()))
            param_hash = hashlib.md5(param_repr.encode("utf-8")).hexdigest()
            cache_key = f"analytics:{func.__name__}:{param_hash}"

            try:
                cached = cache.get(cache_key)
                if cached is not None:
                    return cached
            except Exception as e:
                # Si el cache falla (Redis caído, etc.), no romper el endpoint:
                # se calcula igual. Fail-open es correcto para CACHE de lectura.
                logger.warning(f"Cache get falló para {cache_key}: {e}")
                return func(request, *args, **kwargs)

            result = func(request, *args, **kwargs)

            try:
                cache.set(cache_key, result, ttl)
            except Exception as e:
                logger.warning(f"Cache set falló para {cache_key}: {e}")

            return result
        return wrapper
    return decorator
