import logging

from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


def api_exception_handler(exc, context):
    if isinstance(exc, ProtectedError):
        return Response(
            {"detail": "This item is still in use and cannot be deleted."},
            status=status.HTTP_409_CONFLICT,
        )
    if isinstance(exc, DjangoValidationError):
        return Response({"detail": exc.messages}, status=status.HTTP_400_BAD_REQUEST)

    response = drf_exception_handler(exc, context)
    if response is None:
        logger.exception("Unhandled API error", exc_info=exc)
        if settings.DEBUG:
            return None  # let Django show the debug page
        return Response({"detail": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return response
