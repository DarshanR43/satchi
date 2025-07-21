# myproject/submission_app/serializers.py
from rest_framework import serializers
from .models import ProjectSubmission

class ProjectSubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer for the ProjectSubmission model.
    Converts model instances to JSON and validates incoming data.
    """
    class Meta:
        model = ProjectSubmission
        fields = '_all_'