from django.db.models import Count, Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from core.activity import log_activity
from core.permissions import IsPortfolioAdmin
from core.serializers import ReorderSerializer
from core.throttles import UploadRateThrottle

from .filters import AdminProjectFilter, PublicProjectFilter
from .models import Project, PublicationStatus, Technology
from .serializers import (
    AdminProjectSerializer,
    ProjectCardSerializer,
    ProjectDetailSerializer,
    PublicTechnologySerializer,
)

SEARCH_FIELDS = [
    "title",
    "short_description",
    "description",
    "client_name",
    "technologies__name",
    "category__name",
]
ORDERING_FIELDS = ["display_order", "created_at", "updated_at", "published_at", "completion_date", "title"]


class PublicProjectViewSet(ReadOnlyModelViewSet):
    """Published projects only. Drafts are never exposed here."""

    permission_classes = [AllowAny]
    authentication_classes = []
    lookup_field = "slug"
    filterset_class = PublicProjectFilter
    search_fields = SEARCH_FIELDS
    ordering_fields = ORDERING_FIELDS
    ordering = ["display_order", "-created_at"]

    def get_queryset(self):
        return (
            Project.objects.published()
            .select_related("category")
            .prefetch_related("technologies", "images")
        )

    def get_serializer_class(self):
        return ProjectDetailSerializer if self.action == "retrieve" else ProjectCardSerializer

    @extend_schema(
        parameters=[OpenApiParameter("limit", int, description="Maximum items (default 6, max 12).")],
        responses=ProjectCardSerializer(many=True),
    )
    @action(detail=False, methods=["get"], pagination_class=None)
    def featured(self, request):
        try:
            limit = max(1, min(int(request.query_params.get("limit", 6)), 12))
        except ValueError:
            limit = 6
        queryset = self.get_queryset().filter(is_featured=True)[:limit]
        return Response(ProjectCardSerializer(queryset, many=True, context=self.get_serializer_context()).data)


class PublicTechnologyViewSet(ReadOnlyModelViewSet):
    """Technologies used by at least one published project."""

    serializer_class = PublicTechnologySerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    pagination_class = None
    filter_backends = []
    lookup_field = "slug"

    def get_queryset(self):
        return (
            Technology.objects.annotate(
                project_count=Count("projects", filter=Q(projects__publication_status=PublicationStatus.PUBLISHED))
            )
            .filter(project_count__gt=0)
            .order_by("name")
        )


class AdminProjectViewSet(ModelViewSet):
    """Full CRUD for administrators, including drafts."""

    permission_classes = [IsPortfolioAdmin]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filterset_class = AdminProjectFilter
    search_fields = SEARCH_FIELDS
    ordering_fields = ORDERING_FIELDS
    ordering = ["display_order", "-created_at"]

    def get_throttles(self):
        throttles = super().get_throttles()
        if self.request.method in ("POST", "PUT", "PATCH"):  # writes may carry image uploads
            throttles.append(UploadRateThrottle())
        return throttles

    def get_queryset(self):
        return Project.objects.select_related("category").prefetch_related("technologies", "images")

    def get_serializer_class(self):
        if self.action == "reorder":
            return ReorderSerializer
        return AdminProjectSerializer

    def perform_create(self, serializer):
        project = serializer.save()
        log_activity(self.request.user, "created", "project", project.pk, project.title)

    def perform_update(self, serializer):
        project = serializer.save()
        log_activity(self.request.user, "updated", "project", project.pk, project.title)

    def perform_destroy(self, instance):
        pk, title = instance.pk, instance.title
        instance.delete()
        log_activity(self.request.user, "deleted", "project", pk, title)

    def _set_publication(self, request, project, status_value, action_name):
        serializer = AdminProjectSerializer(
            project, data={"publication_status": status_value}, partial=True, context=self.get_serializer_context()
        )
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        log_activity(request.user, action_name, "project", project.pk, project.title)
        return Response(AdminProjectSerializer(project, context=self.get_serializer_context()).data)

    @extend_schema(request=None, responses=AdminProjectSerializer)
    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        return self._set_publication(request, self.get_object(), PublicationStatus.PUBLISHED, "published")

    @extend_schema(request=None, responses=AdminProjectSerializer)
    @action(detail=True, methods=["post"])
    def unpublish(self, request, pk=None):
        return self._set_publication(request, self.get_object(), PublicationStatus.DRAFT, "unpublished")

    @extend_schema(request=ReorderSerializer, responses=OpenApiTypes.OBJECT)
    @action(detail=False, methods=["post"])
    def reorder(self, request):
        serializer = ReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ids = serializer.validated_data["ids"]
        projects = {p.pk: p for p in Project.objects.filter(pk__in=ids)}
        if len(projects) != len(ids):
            raise ValidationError({"ids": "One or more projects do not exist."})
        for position, project_id in enumerate(ids, start=1):
            projects[project_id].display_order = position
        Project.objects.bulk_update(projects.values(), ["display_order"])
        log_activity(request.user, "reordered", "project", None, f"{len(ids)} projects")
        return Response({"updated": len(ids)})
