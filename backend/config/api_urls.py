"""All routes under /api/v1/."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter, SimpleRouter

from categories.views import AdminCategoryViewSet, PublicCategoryViewSet
from core.views import DashboardView, HealthView
from gallery.views import GalleryImageDetailView, GalleryReorderView, ProjectImageListCreateView
from projects.views import AdminProjectViewSet, PublicProjectViewSet, PublicTechnologyViewSet

public_router = DefaultRouter()
public_router.register("projects", PublicProjectViewSet, basename="project")
public_router.register("categories", PublicCategoryViewSet, basename="category")
public_router.register("technologies", PublicTechnologyViewSet, basename="technology")

admin_router = SimpleRouter()
admin_router.register("projects", AdminProjectViewSet, basename="admin-project")
admin_router.register("categories", AdminCategoryViewSet, basename="admin-category")

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("auth/", include("accounts.urls")),
    path("admin/dashboard/", DashboardView.as_view(), name="admin-dashboard"),
    path("admin/projects/<int:project_id>/images/", ProjectImageListCreateView.as_view(), name="admin-project-images"),
    path("admin/projects/<int:project_id>/images/reorder/", GalleryReorderView.as_view(), name="admin-project-images-reorder"),
    path("admin/images/<int:pk>/", GalleryImageDetailView.as_view(), name="admin-image-detail"),
    path("admin/", include(admin_router.urls)),
    path("", include(public_router.urls)),
]
