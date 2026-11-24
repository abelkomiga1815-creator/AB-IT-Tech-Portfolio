from django.conf import settings
from rest_framework import serializers

from core.validators import validate_image_upload

from .models import ProjectImage


class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = ["id", "image", "caption", "alt_text", "order", "created_at"]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {"image": {"required": False}, "order": {"required": False}}


class GalleryUploadSerializer(serializers.Serializer):
    """Multipart payload: one or more files under `images`, plus optional shared caption / alt text."""

    images = serializers.ListField(
        child=serializers.ImageField(validators=[validate_image_upload]),
        allow_empty=False,
    )
    caption = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    alt_text = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")

    def validate_images(self, value):
        limit = settings.MAX_GALLERY_FILES_PER_REQUEST
        if len(value) > limit:
            raise serializers.ValidationError(f"You can upload at most {limit} images at once.")
        return value
