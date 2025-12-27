from rest_framework import serializers
from decimal import Decimal
from events.models import SubSubEvent
from .models import SubSubEventJudge, Evaluation, EvaluationJudgeMark
from api.models import Project


class SubSubEventJudgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubSubEventJudge
        fields = ("id", "subsubevent", "name", "order")


class CreateJudgesSerializer(serializers.Serializer):
    """
    Input for linking judges to a subsubevent:
    { "subsubevent_id": 5, "names": ["Judge A", "Judge B"], "replace": true }
    """
    subsubevent_id = serializers.IntegerField()
    names = serializers.ListField(child=serializers.CharField(max_length=200))
    replace = serializers.BooleanField(default=False)

    def validate_subsubevent_id(self, v):
        if not SubSubEvent.objects.filter(id=v).exists():
            raise serializers.ValidationError("SubSubEvent not found.")
        return v


class JudgeListResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    order = serializers.IntegerField()


class EvaluationJudgeMarkInputSerializer(serializers.Serializer):
    judge_name = serializers.CharField()
    mark = serializers.DecimalField(max_digits=7, decimal_places=2)
    comments = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class CreateEvaluationSerializer(serializers.Serializer):
    project_id = serializers.IntegerField()
    subsubevent_id = serializers.IntegerField()
    is_disqualified = serializers.BooleanField(default=False)
    remarks = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    marks = serializers.ListField(child=EvaluationJudgeMarkInputSerializer())

    def validate_project_id(self, v):
        if not Project.objects.filter(id=v).exists():
            raise serializers.ValidationError("Project not found.")
        return v

    def validate_subsubevent_id(self, v):
        if not SubSubEvent.objects.filter(id=v).exists():
            raise serializers.ValidationError("SubSubEvent not found.")
        return v

    def validate_marks(self, v):
        if not isinstance(v, list) or len(v) == 0:
            raise serializers.ValidationError("You must provide at least one judge mark.")
        return v


class LegacyTeamMemberInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)


class LegacyProjectInputSerializer(serializers.Serializer):
    team_name = serializers.CharField(max_length=100)
    project_topic = serializers.CharField()
    captain_name = serializers.CharField(max_length=100)
    captain_email = serializers.EmailField()
    captain_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    faculty_mentor_name = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    submitted_at = serializers.DateTimeField(required=False)
    team_members = LegacyTeamMemberInputSerializer(many=True, required=False)


class LegacyEvaluationMarkSerializer(serializers.Serializer):
    judge_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    mark = serializers.DecimalField(max_digits=7, decimal_places=2)
    comments = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    subsubevent_judge_id = serializers.IntegerField(required=False, allow_null=True)


class LegacyEvaluationInputSerializer(serializers.Serializer):
    is_disqualified = serializers.BooleanField(default=False)
    remarks = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    marks = LegacyEvaluationMarkSerializer(many=True)

    def validate_marks(self, value):
        if not value:
            raise serializers.ValidationError("Provide at least one judge mark.")
        return value


class LegacyRegistrationSerializer(serializers.Serializer):
    subsubevent_id = serializers.IntegerField()
    project = LegacyProjectInputSerializer()
    evaluation = LegacyEvaluationInputSerializer(required=False, allow_null=True)

    def validate_subsubevent_id(self, value):
        if not SubSubEvent.objects.filter(id=value).exists():
            raise serializers.ValidationError("SubSubEvent not found.")
        return value