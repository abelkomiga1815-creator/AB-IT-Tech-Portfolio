from django.contrib import admin

from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "actor", "action", "target_type", "target_label")
    list_filter = ("action", "target_type")
    readonly_fields = [f.name for f in ActivityLog._meta.fields]
