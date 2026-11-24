"""Shared helpers for the automated tests."""
import io

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APIClient, APITestCase

PASSWORD = "Str0ng-Test-Pass-123"
_CONTENT_TYPES = {"PNG": "image/png", "JPEG": "image/jpeg", "WEBP": "image/webp", "GIF": "image/gif"}


def make_image(name="test.png", fmt="PNG", size=(40, 30), color=(20, 60, 200)):
    buffer = io.BytesIO()
    Image.new("RGB", size, color).save(buffer, format=fmt)
    return SimpleUploadedFile(name, buffer.getvalue(), content_type=_CONTENT_TYPES[fmt])


def create_admin(username="admin", email=None, password=PASSWORD):
    User = get_user_model()
    return User.objects.create_user(
        username=username, email=email or f"{username}@example.com", password=password, is_staff=True
    )


def create_regular_user(username="visitor", password=PASSWORD):
    User = get_user_model()
    return User.objects.create_user(username=username, email=f"{username}@example.com", password=password)


def client_for(user=None):
    client = APIClient()
    if user is not None:
        client.force_authenticate(user=user)
    return client


class BaseAPITestCase(APITestCase):
    def setUp(self):
        super().setUp()
        cache.clear()  # throttling counters live in the cache
