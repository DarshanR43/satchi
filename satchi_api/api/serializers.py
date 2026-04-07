from rest_framework import serializers

from api.models import Project

class ProjectSerializer(serializers.ModelSerializer):
    project_id = serializers.IntegerField(source='id', read_only=True)
    has_evaluation = serializers.BooleanField(read_only=True, default=False)
    members = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "project_id",
            "team_name",
            "project_topic",
            "trl_level",
            "sdgs",
            "captain_name",
            "captain_phone",
            "captain_email",
            "team_members",
            "members",
            "faculty_mentor_name",
            "submitted_at",
            "has_evaluation",
        ]

    def get_members(self, obj):
        members = getattr(obj, "members", None)
        if members is None:
            return []
        return [
            {
                "id": member.id,
                "name": member.name,
                "email": member.email,
                "phone": member.phone,
                "user_id": member.user_id,
            }
            for member in members.all()
        ]
