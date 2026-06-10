from ninja import Router
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.throttling import AnonRateThrottle
from ninja.errors import HttpError
from django.conf import settings
from django.http import JsonResponse
import json

router = Router(tags=["auth"])

COOKIE_SECURE = getattr(settings, "SESSION_COOKIE_SECURE", False)
ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"
ACCESS_MAX_AGE = 60 * 60 * 2       # 2 horas
REFRESH_MAX_AGE = 60 * 60 * 24     # 24 horas


class LoginRateThrottle(AnonRateThrottle):
    scope = "login"


def _set_auth_cookies(response, access: str, refresh: str = None):
    response.set_cookie(
        ACCESS_COOKIE, access,
        max_age=ACCESS_MAX_AGE,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="Lax",
        path="/",
    )
    if refresh:
        response.set_cookie(
            REFRESH_COOKIE, refresh,
            max_age=REFRESH_MAX_AGE,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite="Lax",
            path="/",
        )


def _clear_auth_cookies(response):
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(REFRESH_COOKIE, path="/")


@router.post("/token", auth=None)
def obtain_token(request):
    throttle = LoginRateThrottle()
    if not throttle.allow_request(request, None):
        raise HttpError(429, "Demasiados intentos de login. Esperá un momento e intentá nuevamente.")

    body = json.loads(request.body or "{}")
    username = body.get("username", "")
    password = body.get("password", "")

    from django.contrib.auth import authenticate
    user = authenticate(request, username=username, password=password)
    if not user:
        raise HttpError(401, "Credenciales inválidas.")

    tokens = RefreshToken.for_user(user)
    access = str(tokens.access_token)
    refresh = str(tokens)

    response = JsonResponse({"detail": "Login exitoso."})
    _set_auth_cookies(response, access, refresh)
    return response


@router.post("/token/refresh", auth=None)
def refresh_token(request):
    refresh = request.COOKIES.get(REFRESH_COOKIE)
    if not refresh:
        raise HttpError(401, "No hay sesión activa.")
    try:
        token = RefreshToken(refresh)
        
        # SimpleJWT token rotation
        from rest_framework_simplejwt.settings import api_settings
        if api_settings.ROTATE_REFRESH_TOKENS:
            if api_settings.BLACKLIST_AFTER_ROTATION:
                try:
                    token.blacklist()
                except AttributeError:
                    pass
            token.set_jti()
            token.set_exp()
            token.set_iat()
            
        new_access = str(token.access_token)
        new_refresh = str(token)
        response = JsonResponse({"detail": "Token renovado."})
        _set_auth_cookies(response, new_access, new_refresh)
        return response
    except Exception:
        raise HttpError(401, "Sesión expirada. Iniciá sesión nuevamente.")


@router.post("/logout", auth=None)
def logout(request):
    refresh = request.COOKIES.get(REFRESH_COOKIE)
    try:
        if refresh:
            token = RefreshToken(refresh)
            token.blacklist()
    except Exception:
        pass
    response = JsonResponse({"status": "logged_out"})
    _clear_auth_cookies(response)
    return response
