from django.utils.text import slugify


def unique_slug(model, value, *, instance=None, field="slug", max_length=140, fallback="item"):
    """Return a slug derived from `value` that is unique for `model.field`."""
    base = slugify(value)[:max_length].strip("-") or fallback
    slug = base
    qs = model._default_manager.all()
    if instance is not None and instance.pk:
        qs = qs.exclude(pk=instance.pk)
    counter = 2
    while qs.filter(**{field: slug}).exists():
        suffix = f"-{counter}"
        slug = f"{base[: max_length - len(suffix)]}{suffix}"
        counter += 1
    return slug
