from django.db import connection
from django.db.models import Count, Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from categories.models import Category
from gallery.models import ProjectImage
from projects.models import Project, PublicationStatus, Technology

from .models import ActivityLog
from .permissions import IsPortfolioAdmin
from .serializers import ActivityLogSerializer


class HealthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    @extend_schema(responses=OpenApiTypes.OBJECT, auth=[])
    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return Response({"status": "ok"})


class DashboardView(APIView):
    permission_classes = [IsPortfolioAdmin]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        counts = Project.objects.aggregate(
            total=Count("id"),
            published=Count("id", filter=Q(publication_status=PublicationStatus.PUBLISHED)),
            drafts=Count("id", filter=Q(publication_status=PublicationStatus.DRAFT)),
            featured=Count("id", filter=Q(is_featured=True)),
        )
        recent_projects = Project.objects.order_by("-updated_at")[:5]
        activity = ActivityLog.objects.select_related("actor")[:10]
        return Response(
            {
                "stats": {
                    "total_projects": counts["total"],
                    "published_projects": counts["published"],
                    "draft_projects": counts["drafts"],
                    "featured_projects": counts["featured"],
                    "categories": Category.objects.count(),
                    "technologies": Technology.objects.count(),
                    "gallery_images": ProjectImage.objects.count(),
                },
                "recent_projects": [
                    {
                        "id": p.id,
                        "title": p.title,
                        "slug": p.slug,
                        "publication_status": p.publication_status,
                        "is_featured": p.is_featured,
                        "updated_at": p.updated_at,
                    }
                    for p in recent_projects
                ],
                "recent_activity": ActivityLogSerializer(activity, many=True).data,
            }
        )
