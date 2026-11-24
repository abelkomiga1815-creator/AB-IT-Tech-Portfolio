from django.db import transaction
from rest_framework import serializers

from categories.models import Category
from categories.serializers import CategoryMiniSerializer
from gallery.serializers import GalleryImageSerializer

from .models import Project, ProjectStatus, PublicationStatus, Technology


class TagListField(serializers.Field):
    """Accepts a list of names or a comma-separated string (handy for multipart forms)."""

    default_error_messages = {
        "invalid": "Provide a list of names or a comma-separated string.",
        "too_long": "Each technology name must be 60 characters or fewer.",
        "too_many": "A project can list at most 20 technologies.",
    }

    def to_internal_value(self, data):
        if isinstance(data, str):
            items = data.split(",")
        elif isinstance(data, (list, tuple)):
            items = data
        else:
            self.fail("invalid")
        seen, names = set(), []
        for item in items:
            if not isinstance(item, str):
                self.fail("invalid")
            name = " ".join(item.split())
            if not name:
                continue
            if len(name) > 60:
                self.fail("too_long")
            if name.lower() in seen:
                continue
            seen.add(name.lower())
            names.append(name)
        if len(names) > 20:
            self.fail("too_many")
        return names

    def to_representation(self, value):
        return [tech.name for tech in value.all()]


def resolve_technologies(names):
    technologies = []
    for name in names:
        tech = Technology.objects.filter(name__iexact=name).first()
        if tech is None:
            tech = Technology.objects.create(name=name)
        technologies.append(tech)
    return technologies


class ProjectCardSerializer(serializers.ModelSerializer):
    """Lightweight public representation used in lists."""

    category = CategoryMiniSerializer(read_only=True)
    technologies = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "slug",
            "short_description",
            "cover_image",
            "cover_alt",
            "category",
            "technologies",
            "project_status",
            "is_featured",
            "completion_date",
            "published_at",
        ]
        read_only_fields = fields


class ProjectDetailSerializer(ProjectCardSerializer):
    images = GalleryImageSerializer(many=True, read_only=True)
    related_projects = serializers.SerializerMethodField()

    class Meta(ProjectCardSerializer.Meta):
        fields = ProjectCardSerializer.Meta.fields + [
            "description",
            "objectives",
            "problem_statement",
            "solution",
            "live_demo_url",
            "source_code_url",
            "client_name",
            "seo_title",
            "seo_description",
            "images",
            "related_projects",
        ]
        read_only_fields = fields

    def get_related_projects(self, obj) -> list:
        queryset = (
            Project.objects.published()
            .exclude(pk=obj.pk)
            .select_related("category")
            .prefetch_related("technologies")
        )
        related = list(queryset.filter(category=obj.category)[:3]) if obj.category_id else []
        if len(related) < 3:
            exclude = [p.pk for p in related]
            related += list(queryset.exclude(pk__in=exclude)[: 3 - len(related)])
        return ProjectCardSerializer(related, many=True, context=self.context).data


class AdminProjectSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), allow_null=True, required=False)
    category_detail = CategoryMiniSerializer(source="category", read_only=True)
    technologies = TagListField(required=False)
    images = GalleryImageSerializer(many=True, read_only=True)
    remove_cover_image = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "slug",
            "short_description",
            "description",
            "objectives",
            "problem_statement",
            "solution",
            "cover_image",
            "cover_alt",
            "remove_cover_image",
            "category",
            "category_detail",
            "technologies",
            "project_status",
            "publication_status",
            "is_featured",
            "live_demo_url",
            "source_code_url",
            "client_name",
            "completion_date",
            "seo_title",
            "seo_description",
            "display_order",
            "published_at",
            "images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "published_at", "created_at", "updated_at"]
        extra_kwargs = {"slug": {"required": False, "allow_blank": True}, "cover_image": {"required": False}}

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title is required.")
        return value

    def validate(self, attrs):
        instance = self.instance

        def pick(name, default=""):
            if name in attrs:
                return attrs[name]
            return getattr(instance, name, default) if instance else default

        if pick("publication_status", PublicationStatus.DRAFT) == PublicationStatus.PUBLISHED:
            errors = {}
            if not str(pick("short_description")).strip():
                errors["short_description"] = "A short description is required to publish."
            if not str(pick("description")).strip():
                errors["description"] = "A full description is required to publish."
            if errors:
                raise serializers.ValidationError(errors)
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        names = validated_data.pop("technologies", [])
        validated_data.pop("remove_cover_image", None)
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        project = Project.objects.create(**validated_data)
        project.technologies.set(resolve_technologies(names))
        return project

    @transaction.atomic
    def update(self, instance, validated_data):
        names = validated_data.pop("technologies", None)
        remove_cover = validated_data.pop("remove_cover_image", False)
        if remove_cover and "cover_image" not in validated_data:
            instance.cover_image = ""
        instance = super().update(instance, validated_data)
        if names is not None:
            instance.technologies.set(resolve_technologies(names))
        return instance


class PublicTechnologySerializer(serializers.ModelSerializer):
    project_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Technology
        fields = ["id", "name", "slug", "project_count"]
        read_only_fields = fields
