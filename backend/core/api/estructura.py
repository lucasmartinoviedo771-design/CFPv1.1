from ninja import Router
from django.shortcuts import get_object_or_404

from core.models import Programa
from core.serializers import ProgramaDetailSerializer
from core.api.permissions import require_authenticated_group

router = Router(tags=["estructura"])


@router.get("/estructura", response=dict)
@require_authenticated_group
def estructura_programa(request, programa: int):
    """Estructura detallada de un programa (bloques y módulos)."""
    prog = get_object_or_404(Programa.objects.prefetch_related("bloques__modulos"), pk=programa)
    return ProgramaDetailSerializer(prog).data
