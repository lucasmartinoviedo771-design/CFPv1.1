import time
import logging
from functools import wraps
from django.core.cache import cache
from ninja.errors import HttpError

logger = logging.getLogger(__name__)

def get_client_ip(request):
    """
    Retrieves the client's IP address, accounting for reverse proxies (Nginx/Cloudflare).
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # HTTP_X_FORWARDED_FOR can be a comma-separated list of IPs. The first one is the client.
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def ip_rate_limit(limit: int, period: int):
    """
    Decorator to rate limit requests to a Django Ninja endpoint by client IP.
    
    limit: Number of requests allowed within the period.
    period: Time window in seconds (e.g. 3600 for an hour).
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            ip = get_client_ip(request)
            key = f"rate_limit:{func.__name__}:{ip}"
            
            # Retrieve request history timestamps from cache
            history = cache.get(key, [])
            now = time.time()
            
            # Filter out timestamps outside the time window
            history = [t for t in history if now - t < period]
            
            if len(history) >= limit:
                logger.warning(f"Rate limit exceeded for IP {ip} on endpoint {func.__name__}")
                raise HttpError(429, "Demasiados intentos. Por favor, esperá un momento e intentá nuevamente.")
            
            # Add current timestamp and save back to cache
            history.append(now)
            cache.set(key, history, period)
            
            return func(request, *args, **kwargs)
        return wrapper
    return decorator
