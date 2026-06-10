from ninja import Router
from core.api.permissions import require_authenticated_group

router = Router(tags=["user"])


@router.get("/user", response=dict)
@require_authenticated_group
def current_user(request):
    user = request.user
    groups = list(user.groups.values_list("name", flat=True))
    must_change = getattr(getattr(user, "profile", None), "must_change_password", False)
    return {
        "username": user.username,
        "email": user.email,
        "groups": groups,
        "is_superuser": user.is_superuser,
        "must_change_password": must_change
    }
