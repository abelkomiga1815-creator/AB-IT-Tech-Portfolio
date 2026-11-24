from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    """Lightweight audit trail shown in the dashboard's "Recent activity" panel."""

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="activity_logs",
    )
    action = models.CharField(max_length=40)
    target_type = models.CharField(max_length=40)
    target_id = models.PositiveIntegerField(null=True, blank=True)
    target_label = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.action}: {self.target_label}"
