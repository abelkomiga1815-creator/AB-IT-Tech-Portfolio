from django.apps import AppConfig


class GalleryConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "gallery"
    verbose_name = "Project gallery"

    def ready(self):
        from core.files import register_file_cleanup

        from .models import ProjectImage

        register_file_cleanup(ProjectImage, ["image"])
