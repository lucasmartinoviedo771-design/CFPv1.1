from ninja import Router
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

# Usamos las vistas de DRF internamente, pero las exponemos bajo /api/v2/.

router = Router(tags=["auth"])


@router.post("/token", auth=None)
def obtain_token(request):
    view = TokenObtainPairView.as_view()
    return view(request)


@router.post("/token/refresh", auth=None)
def refresh_token(request):
    view = TokenRefreshView.as_view()
    return view(request)


@router.post("/logout", auth=None)
def logout(request, refresh: str):
    """Blacklistea el refresh token."""
    if not refresh:
        return 400, {"detail": "'refresh' is required"}
    try:
        token = RefreshToken(refresh)
        token.blacklist()
    except Exception:
        return 400, {"detail": "Invalid refresh token"}
    return {"status": "logged_out"}
