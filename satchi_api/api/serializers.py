from rest_framework import serializers

from api.models import Project

class ProjectSerializer(serializers.ModelSerializer):
    project_id = serializers.IntegerField(source='id', read_only=True)

    class Meta:
        model = Project
        fields = [
            "project_id",
            "team_name",
            "project_topic",
            "captain_name",
            "captain_phone",
            "captain_email",
            "team_members",
            "faculty_mentor_name",
            "submitted_at",
        ]