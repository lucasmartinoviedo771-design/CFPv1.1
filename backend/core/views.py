import os
import posixpath
from django.http import HttpResponse, HttpResponseForbidden, Http404
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

def protected_media_view(request, path):
    user = None
    
    # Check 1: Django Session Authentication (Cookies)
    if request.user and request.user.is_authenticated:
        user = request.user
        
    # Check 2: SimpleJWT Bearer Token in Authorization Header
    if not user:
        try:
            auth_result = JWTAuthentication().authenticate(request)
            if auth_result:
                user, _ = auth_result
        except (InvalidToken, TokenError):
            pass
            
    # Check 3: SimpleJWT Token in Query Parameter (?token=...)
    if not user:
        token = request.GET.get('token')
        if token:
            try:
                validated_token = JWTAuthentication().get_validated_token(token)
                user = JWTAuthentication().get_user(validated_token)
            except (InvalidToken, TokenError):
                pass

    # Check 4: SimpleJWT Token in HttpOnly Cookie (access_token)
    if not user:
        cookie_token = request.COOKIES.get("access_token")
        if cookie_token:
            try:
                validated_token = JWTAuthentication().get_validated_token(cookie_token)
                user = JWTAuthentication().get_user(validated_token)
            except (InvalidToken, TokenError):
                pass

    # Deny access if user is not authenticated
    if not user or not user.is_authenticated:
        return HttpResponseForbidden("Acceso denegado: Se requiere autenticación válida.")

    # Enforce role/group-based authorization for media access
    allowed_groups = {
        "Admin", "Rector", "Rectorado", "Regencia", "Secretaría", 
        "Preceptor", "Bedel"
    }
    user_groups = set(user.groups.values_list('name', flat=True))
    is_authorized = (
        user.is_superuser or
        user.is_staff or
        bool(user_groups & allowed_groups)
    )
    if not is_authorized:
        return HttpResponseForbidden("Acceso denegado: No posee los permisos requeridos para ver este archivo.")

    # Prevent Directory Traversal / Path Traversal
    normalized_path = posixpath.normpath(path)
    if normalized_path.startswith('..') or normalized_path.startswith('/') or os.path.isabs(normalized_path):
        return HttpResponseForbidden("Acceso denegado: Ruta de archivo inválida.")

    # Verify if file exists physically inside the media directory to fail close
    full_path = os.path.join(settings.MEDIA_ROOT, normalized_path)
    abs_media_root = os.path.abspath(settings.MEDIA_ROOT)
    abs_full_path = os.path.abspath(full_path)
    
    # Enforce strict path traversal sandbox boundary
    if not abs_full_path.startswith(abs_media_root + os.path.sep) and abs_full_path != abs_media_root:
         return HttpResponseForbidden("Acceso denegado: Intento de escape de sandbox detectado.")

    if not os.path.exists(abs_full_path) or not os.path.isfile(abs_full_path):
        raise Http404("El archivo solicitado no existe.")

    # Return empty response with X-Accel-Redirect header for Nginx to serve
    redirect_url = f"/protected_media/{normalized_path}"
    response = HttpResponse()
    response['X-Accel-Redirect'] = redirect_url
    
    # Clear Content-Type to let Nginx autodetect correct MIME types (PDF, PNG, etc.)
    response['Content-Type'] = ''
    response['X-Content-Type-Options'] = 'nosniff'
    
    # Use inline Content-Disposition so browsers can preview PDFs/Images directly
    filename = os.path.basename(normalized_path)
    response['Content-Disposition'] = f'inline; filename="{filename}"'
    
    return response
