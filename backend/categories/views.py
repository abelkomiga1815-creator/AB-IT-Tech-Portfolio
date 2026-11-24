from django.db.models import Count, Q
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from core.activity import log_activity
from core.permissions import IsPortfolioAdmin

from .models import Category
from .serializers import AdminCategorySerializer, PublicCategorySerializer


class PublicCategoryViewSet(ReadOnlyModelViewSet):
    """Categories that contain at least one published project."""

    serializer_class = PublicCategorySerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    pagination_class = None
    lookup_field = "slug"
    filter_backends = []

    def get_queryset(self):
        return (
            Category.objects.annotate(project_count=Count("projects", filter=Q(projects__publication_status="published")))
            .filter(project_count__gt=0)
            .order_by("display_order", "name")
        )


class AdminCategoryViewSet(ModelViewSet):
    serializer_class = AdminCategorySerializer
    permission_classes = [IsPortfolioAdmin]
    pagination_class = None
    search_fields = ["name", "description"]

    def get_queryset(self):
        return Category.objects.annotate(project_count=Count("projects")).order_by("display_order", "name")

    def perform_create(self, serializer):
        category = serializer.save()
        log_activity(self.request.user, "created", "category", category.pk, category.name)

    def perform_update(self, serializer):
        category = serializer.save()
        log_activity(self.request.user, "updated", "category", category.pk, category.name)

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        if category.projects.exists():
            return Response(
                {"detail": "This category still has projects. Move or delete them before deleting the category."},
                status=status.HTTP_409_CONFLICT,
            )
        pk, name = category.pk, category.name
        category.delete()
        log_activity(request.user, "deleted", "category", pk, name)
        return Response(status=status.HTTP_204_NO_CONTENT)
