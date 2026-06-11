from functools import wraps
from ninja.errors import HttpError
from core.roles import IsInAGroup


def require_authenticated_group(func):
    """Decorator para routers Ninja que exige usuario autenticado y en algún grupo."""
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        if not request.user or not request.user.is_authenticated:
            raise HttpError(401, "Authentication credentials were not provided.")
        # Superusuarios tienen acceso automático
        if request.user.is_superuser:
            return func(request, *args, **kwargs)
        
        # Excluir usuarios que SOLO pertenecen al grupo "Videojuegos" (no tienen acceso a CFP normal)
        user_groups = list(request.user.groups.values_list('name', flat=True))
        if "Videojuegos" in user_groups and len(user_groups) == 1:
            raise HttpError(403, "You do not have permission to perform this action.")

        if not IsInAGroup().has_permission(request, None):
            raise HttpError(403, "You do not have permission to perform this action.")
        return func(request, *args, **kwargs)
    return wrapper


def require_admin(func):
    """Decorator que sólo permite Admin/staff/superuser o miembros de grupos de gestión (Rector, Regencia, Secretaría)."""
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        if not request.user or not request.user.is_authenticated:
            raise HttpError(401, "Authentication credentials were not provided.")
        allowed_groups = ["Admin", "Rector", "Regencia", "Secretaría"]
        is_allowed = (
            request.user.is_staff or 
            request.user.is_superuser or 
            request.user.groups.filter(name__in=allowed_groups).exists()
        )
        if not is_allowed:
            raise HttpError(403, "You do not have permission to perform this action.")
        return func(request, *args, **kwargs)
    return wrapper
