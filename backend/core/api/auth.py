from ninja.security import HttpBearer
from rest_framework_simplejwt.authentication import JWTAuthentication


class JWTAuth(HttpBearer):
    """Autenticacion Bearer reutilizando JWT de DRF SimpleJWT."""

    def __init__(self):
        super().__init__()
        self.jwt_auth = JWTAuthentication()

    def authenticate(self, request, token):
        try:
            validated = self.jwt_auth.get_validated_token(token)
            user = self.jwt_auth.get_user(validated)
            request.user = user
            return user
        except Exception:
            return None


jwt_auth = JWTAuth()
