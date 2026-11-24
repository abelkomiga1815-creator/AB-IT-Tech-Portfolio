from rest_framework import serializers

from .models import Category


class CategoryMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]
        read_only_fields = fields


class PublicCategorySerializer(serializers.ModelSerializer):
    project_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "project_count"]
        read_only_fields = fields


class AdminCategorySerializer(serializers.ModelSerializer):
    project_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "display_order", "project_count", "created_at", "updated_at"]
        read_only_fields = ["id", "project_count", "created_at", "updated_at"]
        extra_kwargs = {"slug": {"required": False, "allow_blank": True}}

    def validate_name(self, value):
        value = " ".join(value.split())
        qs = Category.objects.filter(name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A category with this name already exists.")
        return value
