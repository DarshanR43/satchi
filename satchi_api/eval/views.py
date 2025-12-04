from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from events.models import MainEvent, SubEvent, SubSubEvent
from users.models import User
from api.models import Project, TeamMember
from events.models import MainEvent,SubEvent,SubSubEvent
from eval.models import Evaluation

from django.db import transaction, IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from decimal import Decimal

from events.models import SubSubEvent
from api.models import Project
from .models import SubSubEventJudge, Evaluation, EvaluationJudgeMark
from .serializers import (
    CreateJudgesSerializer,
    SubSubEventJudgeSerializer,
    JudgeListResponseSerializer,
    CreateEvaluationSerializer,
)

@api_view(['POST'])
def get_main_events(request):
    if request.method == 'POST':
        main_events = MainEvent.objects.all()
        event_list = []
        for event in main_events:
            event_list.append({
                'id': event.id,
                'name': event.name,
                'description': event.description
            })
        return Response(event_list, status=status.HTTP_200_OK)

@api_view(['POST'])
def get_subevents(request, main_event_id):
    if request.method == 'POST':
        try:
            main_event = MainEvent.objects.get(id=main_event_id)
        except MainEvent.DoesNotExist:
            return Response({"error": "Main event not found."}, status=status.HTTP_404_NOT_FOUND)

        subevents = SubEvent.objects.filter(parent_event=main_event)
        subevent_list = []
        for subevent in subevents:
            subevent_list.append({
                'id': subevent.id,
                'name': subevent.name,
                'description': subevent.description
            })
        return Response(subevent_list, status=status.HTTP_200_OK)

@api_view(['POST'])
def get_subsubevents(request, sub_event_id):
    if request.method == 'POST':
        try:
            sub_event = SubEvent.objects.get(id=sub_event_id)
        except SubEvent.DoesNotExist:
            return Response({"error": "Sub event not found."}, status=status.HTTP_404_NOT_FOUND)

        subsubevents = SubSubEvent.objects.filter(parent_subevent=sub_event)
        subsubevent_list = []
        for subsubevent in subsubevents:
            subsubevent_list.append({
                'id': subsubevent.id,
                'name': subsubevent.name,
                'description': subsubevent.description,
                'rules': subsubevent.rules,
                'minTeamSize': subsubevent.minTeamSize,
                'maxTeamSize': subsubevent.maxTeamSize,
                'minFemaleParticipants': subsubevent.minFemaleParticipants,
                'isFacultyMentorRequired': subsubevent.isFacultyMentorRequired,
                'event_id': subsubevent.event_id
            })
        return Response(subsubevent_list, status=status.HTTP_200_OK)

@api_view(['GET'])
def getProjectsByEvent(request, event_id):
    try:
        event = SubSubEvent.objects.get(id=event_id)
        projects = Project.objects.filter(event=event)
        project_list = []
        for project in projects:
            project_list.append({
                'team_name': project.team_name,
                'project_topic': project.project_topic,
                'captain_name': project.captain_name,
                'captain_email': project.captain_email,
                'captain_phone': project.captain_phone,
                'team_members': project.team_members,
                'faculty_mentor_name': project.faculty_mentor_name,
                'submitted_at': project.submitted_at
            })
        return Response(project_list, status=status.HTTP_200_OK)
    except SubSubEvent.DoesNotExist:
        return Response({"error": "Event not found."}, status=status.HTTP_400_BAD_REQUEST)

from django.db import transaction, IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from decimal import Decimal

from events.models import SubSubEvent
from api.models import Project
from .models import SubSubEventJudge, Evaluation, EvaluationJudgeMark
from .serializers import (
    CreateJudgesSerializer,
    SubSubEventJudgeSerializer,
    JudgeListResponseSerializer,
    CreateEvaluationSerializer,
)


@api_view(["POST"])
@permission_classes([IsAuthenticatedOrReadOnly])
def link_judges_to_subsubevent(request):
    """
    POST payload:
    {
      "subsubevent_id": 5,
      "names": ["Judge A", "Judge B"],
      "replace": true   # optional, default false. If true, deletes existing judges for that subsubevent first.
    }
    """
    serializer = CreateJudgesSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    subsub = get_object_or_404(SubSubEvent, id=data["subsubevent_id"])

    with transaction.atomic():
        if data.get("replace"):
            SubSubEventJudge.objects.filter(subsubevent=subsub).delete()

        created = []
        order = 0
        for name in data["names"]:
            order += 1
            # Use get_or_create to avoid duplicates
            obj, created_flag = SubSubEventJudge.objects.get_or_create(
                subsubevent=subsub,
                name=name.strip(),
                defaults={"order": order},
            )
            # update order if needed
            if not created_flag and obj.order != order:
                obj.order = order
                obj.save(update_fields=["order"])
            created.append({"id": obj.id, "name": obj.name, "order": obj.order})

    return Response({"subsubevent_id": subsub.id, "judges": created}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticatedOrReadOnly])
def list_judges_for_subsubevent(request, subsubevent_id):
    """
    GET /api/subsubevents/<id>/judges/
    Returns list of judges (id, name, order)
    """
    subsub = get_object_or_404(SubSubEvent, id=subsubevent_id)
    qs = SubSubEventJudge.objects.filter(subsubevent=subsub).order_by("order", "name")
    data = [{"id": j.id, "name": j.name, "order": j.order} for j in qs]
    return Response({"subsubevent_id": subsub.id, "judges": data}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticatedOrReadOnly])
def submit_evaluation_marks(request):
    """
    Create an Evaluation and EvaluationJudgeMark rows.

    Example payload:
    {
      "project_id": 123,
      "subsubevent_id": 45,
      "is_disqualified": false,
      "remarks": "Nice work",
      "marks": [
        {"judge_name": "Judge A", "mark": "78.5", "comments": "Good"},
        {"judge_name": "Judge B", "mark": "82.00"}
      ]
    }
    """
    serializer = CreateEvaluationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    project = get_object_or_404(Project, id=data["project_id"])
    subsub = get_object_or_404(SubSubEvent, id=data["subsubevent_id"])

    with transaction.atomic():
        # Ensure uniqueness of evaluation per project+subsubevent if needed
        evaluation, created = Evaluation.objects.get_or_create(
            project=project,
            subsubevent=subsub,
            defaults={
                "is_disqualified": data.get("is_disqualified", False),
                "remarks": data.get("remarks", "") or "",
            },
        )
        # if it already existed and you want to replace marks, you can clear them:
        if not created:
            # optional: clear existing marks to overwrite
            evaluation.judge_marks.all().delete()
            evaluation.is_disqualified = data.get("is_disqualified", evaluation.is_disqualified)
            evaluation.remarks = data.get("remarks", evaluation.remarks)
            evaluation.save(update_fields=["is_disqualified", "remarks"])

        marks_input = data["marks"]
        created_marks = []
        for mi in marks_input:
            judge_name = mi["judge_name"].strip()
            mark_decimal = Decimal(str(mi["mark"]))
            comments = mi.get("comments", "") or ""

            # try to link to a SubSubEventJudge if exists
            ssj = SubSubEventJudge.objects.filter(subsubevent=subsub, name=judge_name).first()

            # create EvaluationJudgeMark
            ejm = EvaluationJudgeMark.objects.create(
                evaluation=evaluation,
                subsubevent_judge=ssj,
                judge_name=judge_name,
                mark=mark_decimal,
                comments=comments,
            )
            created_marks.append({"id": ejm.id, "judge_name": ejm.judge_name, "mark": str(ejm.mark)})

        # recompute totals/average and save on evaluation
        try:
            evaluation.recalculate_scores()
            evaluation.save()
        except Exception as exc:
            # Unexpected error: rollback
            raise

    # return created evaluation summary
    resp = {
        "evaluation_id": evaluation.id,
        "project_id": project.id,
        "subsubevent_id": subsub.id,
        "number_of_judges": evaluation.number_of_judges,
        "total": str(evaluation.total),
        "final_score": str(evaluation.final_score),
        "is_disqualified": evaluation.is_disqualified,
        "marks_created": created_marks,
    }
    return Response(resp, status=status.HTTP_201_CREATED)