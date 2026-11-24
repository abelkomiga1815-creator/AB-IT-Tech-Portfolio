from django.conf import settings
from django.db import transaction
from django.db.models import Max
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import GenericAPIView, RetrieveUpdateDestroyAPIView, get_object_or_404
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from core.activity import log_activity
from core.permissions import IsPortfolioAdmin
from core.serializers import ReorderSerializer
from core.throttles import UploadRateThrottle
from projects.models import Project

from .models import ProjectImage
from .serializers import GalleryImageSerializer, GalleryUploadSerializer


class ProjectImageListCreateView(GenericAPIView):
    """List a project's gallery or upload one or more images (multipart field `images`)."""

    permission_classes = [IsPortfolioAdmin]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = GalleryUploadSerializer
    pagination_class = None

    def get_throttles(self):
        throttles = super().get_throttles()
        if self.request.method == "POST":
            throttles.append(UploadRateThrottle())
        return throttles

    @extend_schema(responses=GalleryImageSerializer(many=True))
    def get(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id)
        images = project.images.all()
        return Response(GalleryImageSerializer(images, many=True, context={"request": request}).data)

    @extend_schema(request=GalleryUploadSerializer, responses={201: GalleryImageSerializer(many=True)})
    @transaction.atomic
    def post(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id)
        serializer = GalleryUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        files = serializer.validated_data["images"]

        existing = project.images.count()
        limit = settings.MAX_GALLERY_IMAGES_PER_PROJECT
        if existing + len(files) > limit:
            raise ValidationError({"images": f"A project can have at most {limit} gallery images ({existing} already uploaded)."})

        next_order = (project.images.aggregate(m=Max("order"))["m"] or 0) + 1
        created = []
        for offset, file in enumerate(files):
            created.append(
                ProjectImage.objects.create(
                    project=project,
                    image=file,
                    caption=serializer.validated_data["caption"],
                    alt_text=serializer.validated_data["alt_text"],
                    order=next_order + offset,
                )
            )
        log_activity(request.user, "uploaded", "project", project.pk, f"{len(created)} image(s) for {project.title}")
        data = GalleryImageSerializer(created, many=True, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)


class GalleryImageDetailView(RetrieveUpdateDestroyAPIView):
    """Edit caption / alt text / order, replace the file (multipart `image`) or delete an image."""

    permission_classes = [IsPortfolioAdmin]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    serializer_class = GalleryImageSerializer
    queryset = ProjectImage.objects.select_related("project")

    def get_throttles(self):
        throttles = super().get_throttles()
        if self.request.method in ("PUT", "PATCH"):
            throttles.append(UploadRateThrottle())
        return throttles

    def perform_update(self, serializer):
        image = serializer.save()
        log_activity(self.request.user, "updated", "project", image.project_id, f"gallery image of {image.project.title}")

    def perform_destroy(self, instance):
        project = instance.project
        instance.delete()
        log_activity(self.request.user, "deleted", "project", project.pk, f"gallery image of {project.title}")


class GalleryReorderView(GenericAPIView):
    permission_classes = [IsPortfolioAdmin]
    serializer_class = ReorderSerializer

    @extend_schema(request=ReorderSerializer, responses=OpenApiTypes.OBJECT)
    @transaction.atomic
    def post(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id)
        serializer = ReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ids = serializer.validated_data["ids"]
        images = {image.pk: image for image in project.images.all()}
        if set(ids) != set(images):
            raise ValidationError({"ids": "Provide every image id of this project exactly once."})
        for position, image_id in enumerate(ids, start=1):
            images[image_id].order = position
        ProjectImage.objects.bulk_update(images.values(), ["order"])
        return Response({"updated": len(ids)})
