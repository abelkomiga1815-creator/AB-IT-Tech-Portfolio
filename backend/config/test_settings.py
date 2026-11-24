"""Settings used by the automated test-suite: `python manage.py test --settings=config.test_settings`."""
import atexit
import shutil
import tempfile

from .settings import *  # noqa: F401,F403

SECRET_KEY = "test-secret-key"
DEBUG = False
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
ALLOWED_HOSTS = ["testserver", "localhost"]
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
AUTH_PASSWORD_VALIDATORS = []

_media = tempfile.mkdtemp(prefix="ab_portfolio_test_media_")
MEDIA_ROOT = _media
MEDIA_URL = "/media/"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
atexit.register(lambda: shutil.rmtree(_media, ignore_errors=True))

REST_FRAMEWORK = {  # noqa: F405
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_THROTTLE_RATES": {"anon": "10000/min", "user": "10000/min", "login": "5/min", "upload": "10000/min"},
}
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
