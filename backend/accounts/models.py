from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model (kept swappable-from-day-one). Only staff users may use the dashboard."""

    email = models.EmailField("email address", unique=True)

    REQUIRED_FIELDS = ["email"]
