import django_filters as filters

from .models import Project, ProjectStatus, PublicationStatus


class PublicProjectFilter(filters.FilterSet):
    category = filters.CharFilter(field_name="category__slug")
    technology = filters.CharFilter(field_name="technologies__slug", distinct=True)
    featured = filters.BooleanFilter(field_name="is_featured")
    status = filters.ChoiceFilter(field_name="project_status", choices=ProjectStatus.choices)

    class Meta:
        model = Project
        fields = []


class AdminProjectFilter(filters.FilterSet):
    category = filters.NumberFilter(field_name="category_id")
    technology = filters.CharFilter(field_name="technologies__slug", distinct=True)
    featured = filters.BooleanFilter(field_name="is_featured")
    publication_status = filters.ChoiceFilter(choices=PublicationStatus.choices)
    status = filters.ChoiceFilter(field_name="project_status", choices=ProjectStatus.choices)

    class Meta:
        model = Project
        fields = []
