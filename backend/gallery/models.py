import os
import uuid

from django.db import models
from django.utils import timezone

from core.validators import validate_image_upload


def gallery_upload_to(instance, filename):
    extension = os.path.splitext(filename)[1].lower()
    return f"projects/gallery/{timezone.now():%Y/%m}/{uuid.uuid4().hex}{extension}"


class ProjectImage(models.Model):
    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to=gallery_upload_to, max_length=255, validators=[validate_image_upload])
    caption = models.CharField(max_length=255, blank=True)
    alt_text = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Image {self.pk} for project {self.project_id}"
