from django.apps import AppConfig


class ProjectsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "projects"

    def ready(self):
        from core.files import register_file_cleanup

        from .models import Project

        register_file_cleanup(Project, ["cover_image"])
