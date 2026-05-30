from ninja.security import HttpBearer
from rest_framework_simplejwt.authentication import JWTAuthentication


class JWTAuth(HttpBearer):
    """Autenticación JWT: lee desde cookie HttpOnly o header Authorization Bearer."""

    def __init__(self):
        super().__init__()
        self.jwt_auth = JWTAuthentication()

    def _validate_token(self, request, raw: str):
        try:
            validated = self.jwt_auth.get_validated_token(raw)
            user = self.jwt_auth.get_user(validated)
            request.user = user
            return user
        except Exception:
            return None

    def authenticate(self, request, token):
        # Primero intenta con el Bearer token del header
        if token:
            return self._validate_token(request, token)
        # Fallback a cookie HttpOnly
        cookie = request.COOKIES.get("access_token", "")
        if cookie:
            return self._validate_token(request, cookie)
        return None

    def __call__(self, request):
        # Si no hay header Authorization pero sí cookie, autenticamos por cookie
        auth_header = request.headers.get("Authorization", "")
        if not auth_header:
            cookie = request.COOKIES.get("access_token", "")
            if cookie:
                return self._validate_token(request, cookie)
            return None
        return super().__call__(request)


jwt_auth = JWTAuth()
