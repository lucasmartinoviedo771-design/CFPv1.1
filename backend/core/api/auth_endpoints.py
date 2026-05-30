from ninja import Router
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.throttling import AnonRateThrottle
from ninja.errors import HttpError

router = Router(tags=["auth"])


class LoginRateThrottle(AnonRateThrottle):
    scope = "login"


@router.post("/token", auth=None)
def obtain_token(request):
    throttle = LoginRateThrottle()
    if not throttle.allow_request(request, None):
        raise HttpError(429, "Demasiados intentos de login. Esperá un momento e intentá nuevamente.")
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
        raise HttpError(400, "'refresh' is required")
    try:
        token = RefreshToken(refresh)
        token.blacklist()
    except Exception:
        raise HttpError(400, "Invalid refresh token")
    return {"status": "logged_out"}
