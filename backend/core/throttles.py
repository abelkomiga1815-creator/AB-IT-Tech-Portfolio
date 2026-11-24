from django.conf import settings
from rest_framework.throttling import SimpleRateThrottle, UserRateThrottle


class _LiveRateMixin:
    """Read the rate from settings at call time so tests can override it."""

    def get_rate(self):
        return settings.REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES", {}).get(self.scope)


class LoginRateThrottle(_LiveRateMixin, SimpleRateThrottle):
    """Limits login/refresh attempts per client IP."""

    scope = "login"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


class UploadRateThrottle(_LiveRateMixin, UserRateThrottle):
    """Limits image upload operations per authenticated user."""

    scope = "upload"
