from .models import ActivityLog


def log_activity(actor, action, target_type, target_id, label):
    ActivityLog.objects.create(
        actor=actor if getattr(actor, "is_authenticated", False) else None,
        action=action,
        target_type=target_type,
        target_id=target_id,
        target_label=(label or "")[:255],
    )
