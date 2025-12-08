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
        
        # Safe lookup
        resolved_username = raw
        try:
            if "@" in raw:
                # Filter is safer than get for preventing 500 on duplicates
                users = User.objects.filter(email__iexact=raw)
                if users.exists():
                    resolved_username = users.first().username
            else:
                users = User.objects.filter(username__iexact=raw)
                if users.exists():
                    resolved_username = users.first().username
                    
            return super().validate({"username": resolved_username, "password": password})
        except Exception as e:
            # Fallback debug log (this will print to console where runserver is running)
            print(f"!!! AUTH ERROR: {e}")
            raise


class EmailOrUsernameTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailOrUsernameTokenObtainPairSerializer

