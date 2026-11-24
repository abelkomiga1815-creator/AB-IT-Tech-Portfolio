import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import core.validators
import projects.models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("categories", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Technology",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=60, unique=True)),
                ("slug", models.SlugField(blank=True, max_length=80, unique=True)),
            ],
            options={"verbose_name_plural": "technologies", "ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Project",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("slug", models.SlugField(blank=True, max_length=220, unique=True)),
                ("short_description", models.CharField(blank=True, max_length=300)),
                ("description", models.TextField(blank=True)),
                ("objectives", models.TextField(blank=True)),
                ("problem_statement", models.TextField(blank=True)),
                ("solution", models.TextField(blank=True)),
                (
                    "cover_image",
                    models.ImageField(
                        blank=True,
                        max_length=255,
                        upload_to=projects.models.cover_upload_to,
                        validators=[core.validators.validate_image_upload],
                    ),
                ),
                ("cover_alt", models.CharField(blank=True, max_length=255)),
                (
                    "project_status",
                    models.CharField(
                        choices=[
                            ("completed", "Completed"),
                            ("in_progress", "In progress"),
                            ("maintenance", "Maintenance"),
                            ("concept", "Concept"),
                        ],
                        default="completed",
                        max_length=20,
                    ),
                ),
                (
                    "publication_status",
                    models.CharField(
                        choices=[("draft", "Draft"), ("published", "Published")],
                        db_index=True,
                        default="draft",
                        max_length=20,
                    ),
                ),
                ("is_featured", models.BooleanField(default=False)),
                ("live_demo_url", models.URLField(blank=True, max_length=500)),
                ("source_code_url", models.URLField(blank=True, max_length=500)),
                ("client_name", models.CharField(blank=True, max_length=200)),
                ("completion_date", models.DateField(blank=True, null=True)),
                ("seo_title", models.CharField(blank=True, max_length=70)),
                ("seo_description", models.CharField(blank=True, max_length=200)),
                ("display_order", models.PositiveIntegerField(db_index=True, default=0)),
                ("published_at", models.DateTimeField(blank=True, editable=False, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "category",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="projects",
                        to="categories.category",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_projects",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "technologies",
                    models.ManyToManyField(blank=True, related_name="projects", to="projects.technology"),
                ),
            ],
            options={"ordering": ["display_order", "-created_at"]},
        ),
    ]
