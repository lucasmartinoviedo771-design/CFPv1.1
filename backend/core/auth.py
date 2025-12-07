from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Allow login using username or email (case-insensitive).

    If the provided `username` looks like an email, it tries to find the user by
    email (iexact). Otherwise, it tries a case-insensitive lookup of username
    and resolves to the canonical username before delegating to the parent
    serializer.
    """

    def validate(self, attrs):
        raw = (attrs.get("username") or "").strip()
        password = attrs.get("password")

        resolved_username = raw
        if "@" in raw:
            try:
                u = User.objects.get(email__iexact=raw)
                resolved_username = u.username
            except User.DoesNotExist:
                # Fall back to parent handling (will raise invalid credentials)
                resolved_username = raw
        else:
            try:
                u = User.objects.get(username__iexact=raw)
                resolved_username = u.username
            except User.DoesNotExist:
                resolved_username = raw

        return super().validate({"username": resolved_username, "password": password})


class EmailOrUsernameTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailOrUsernameTokenObtainPairSerializer

