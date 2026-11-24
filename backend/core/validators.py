import os

from django.conf import settings
from django.core.exceptions import ValidationError

ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}


def validate_image_upload(value):
    """Validate size, extension and real image format (SVG and other formats are rejected)."""
    max_mb = settings.MAX_IMAGE_UPLOAD_MB
    if value.size > max_mb * 1024 * 1024:
        raise ValidationError(f"Image is too large. Maximum size is {max_mb} MB.", code="file_too_large")

    extension = os.path.splitext(value.name or "")[1].lower().lstrip(".")
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_IMAGE_EXTENSIONS))
        raise ValidationError(f"Unsupported file type. Allowed types: {allowed}.", code="invalid_extension")

    image = getattr(value, "image", None)  # set by Django's ImageField validation (Pillow)
    if image is not None and image.format not in ALLOWED_IMAGE_FORMATS:
        raise ValidationError("Unsupported image format.", code="invalid_format")
