"""Helpers that keep the storage backend free of orphaned files."""
from django.db import transaction
from django.db.models.signals import post_delete, pre_save


def schedule_file_delete(storage, name):
    if name:
        transaction.on_commit(lambda: storage.delete(name))


def register_file_cleanup(model, field_names):
    """Delete replaced / orphaned files after the surrounding transaction commits."""
    label = model._meta.label_lower

    def _pre_save(sender, instance, **kwargs):
        if not instance.pk:
            return
        old = sender._default_manager.filter(pk=instance.pk).only(*field_names).first()
        if old is None:
            return
        for field in field_names:
            old_file = getattr(old, field)
            new_file = getattr(instance, field)
            new_name = new_file.name if new_file else None
            if old_file and old_file.name != new_name:
                schedule_file_delete(old_file.storage, old_file.name)

    def _post_delete(sender, instance, **kwargs):
        for field in field_names:
            file = getattr(instance, field)
            if file:
                schedule_file_delete(file.storage, file.name)

    pre_save.connect(_pre_save, sender=model, weak=False, dispatch_uid=f"{label}-file-pre-save")
    post_delete.connect(_post_delete, sender=model, weak=False, dispatch_uid=f"{label}-file-post-delete")
