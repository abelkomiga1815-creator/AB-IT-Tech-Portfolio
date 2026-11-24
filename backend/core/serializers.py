from rest_framework import serializers

from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = ["id", "action", "target_type", "target_id", "target_label", "actor_name", "created_at"]

    def get_actor_name(self, obj) -> str:
        return obj.actor.get_username() if obj.actor else "System"


class ReorderSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.IntegerField(min_value=1), allow_empty=False, max_length=500)

    def validate_ids(self, value):
        if len(set(value)) != len(value):
            raise serializers.ValidationError("Duplicate ids are not allowed.")
        return value
