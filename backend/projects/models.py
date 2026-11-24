import os
import uuid

from django.conf import settings
from django.db import models
from django.db.models import Max
from django.utils import timezone

from categories.models import Category
from core.utils import unique_slug
from core.validators import validate_image_upload


class PublicationStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PUBLISHED = "published", "Published"


class ProjectStatus(models.TextChoices):
    COMPLETED = "completed", "Completed"
    IN_PROGRESS = "in_progress", "In progress"
    MAINTENANCE = "maintenance", "Maintenance"
    CONCEPT = "concept", "Concept"


def cover_upload_to(instance, filename):
    extension = os.path.splitext(filename)[1].lower()
    return f"projects/covers/{timezone.now():%Y/%m}/{uuid.uuid4().hex}{extension}"


class Technology(models.Model):
    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(max_length=80, unique=True, blank=True)

    class Meta:
        verbose_name_plural = "technologies"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(Technology, self.name, instance=self, max_length=80, fallback="tech")
        super().save(*args, **kwargs)


class ProjectQuerySet(models.QuerySet):
    def published(self):
        return self.filter(publication_status=PublicationStatus.PUBLISHED)


class Project(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    short_description = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)
    objectives = models.TextField(blank=True)
    problem_statement = models.TextField(blank=True)
    solution = models.TextField(blank=True)

    cover_image = models.ImageField(
        upload_to=cover_upload_to, max_length=255, blank=True, validators=[validate_image_upload]
    )
    cover_alt = models.CharField(max_length=255, blank=True)

    category = models.ForeignKey(
        Category, null=True, blank=True, on_delete=models.PROTECT, related_name="projects"
    )
    technologies = models.ManyToManyField(Technology, blank=True, related_name="projects")

    project_status = models.CharField(max_length=20, choices=ProjectStatus.choices, default=ProjectStatus.COMPLETED)
    publication_status = models.CharField(
        max_length=20, choices=PublicationStatus.choices, default=PublicationStatus.DRAFT, db_index=True
    )
    is_featured = models.BooleanField(default=False)

    live_demo_url = models.URLField(max_length=500, blank=True)
    source_code_url = models.URLField(max_length=500, blank=True)
    client_name = models.CharField(max_length=200, blank=True)
    completion_date = models.DateField(null=True, blank=True)

    seo_title = models.CharField(max_length=70, blank=True)
    seo_description = models.CharField(max_length=200, blank=True)

    display_order = models.PositiveIntegerField(default=0, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True, editable=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_projects"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ProjectQuerySet.as_manager()

    class Meta:
        ordering = ["display_order", "-created_at"]

    def __str__(self):
        return self.title

    @property
    def is_published(self):
        return self.publication_status == PublicationStatus.PUBLISHED

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(Project, self.title, instance=self, max_length=220, fallback="project")
        if self._state.adding and not self.display_order:
            self.display_order = (Project.objects.aggregate(m=Max("display_order"))["m"] or 0) + 1
        if self.is_published:
            if self.published_at is None:
                self.published_at = timezone.now()
        else:
            self.published_at = None
        super().save(*args, **kwargs)
