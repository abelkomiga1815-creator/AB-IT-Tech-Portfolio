import django.db.models.deletion
from django.db import migrations, models

import core.validators
import gallery.models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("projects", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProjectImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "image",
                    models.ImageField(
                        max_length=255,
                        upload_to=gallery.models.gallery_upload_to,
                        validators=[core.validators.validate_image_upload],
                    ),
                ),
                ("caption", models.CharField(blank=True, max_length=255)),
                ("alt_text", models.CharField(blank=True, max_length=255)),
                ("order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="images",
                        to="projects.project",
                    ),
                ),
            ],
            options={"ordering": ["order", "id"]},
        ),
    ]
