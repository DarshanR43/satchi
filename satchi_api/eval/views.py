from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from events.models import MainEvent, SubEvent, SubSubEvent
from users.models import User
from api.models import Project
from api.serializers import ProjectSerializer
from eval.models import Evaluation

from django.db import transaction, IntegrityError
from django.db.models import Exists, OuterRef
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from decimal import Decimal
import csv
from io import StringIO
from django.utils.text import slugify

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
        subsubevent = SubSubEvent.objects.get(id=event_id)
    except SubSubEvent.DoesNotExist:
        return Response({"error": "Event not found."}, status=status.HTTP_400_BAD_REQUEST)

    projects = (
        Project.objects.filter(event=subsubevent)
        .annotate(
            has_evaluation=Exists(
                Evaluation.objects.filter(
                    project=OuterRef("pk"),
                    subsubevent=subsubevent,
                )
            )
        )
        .order_by("id")
    )
    serializer = ProjectSerializer(projects, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


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


import logging
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([IsAuthenticatedOrReadOnly])
def get_evaluation_submission(request):
    """Return an existing evaluation (if any) including judge marks."""

    project_id = request.query_params.get("project_id")
    subsubevent_id = request.query_params.get("subsubevent_id")

    if not project_id or not subsubevent_id:
        return Response(
            {"error": "project_id and subsubevent_id are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        project_id = int(project_id)
        subsubevent_id = int(subsubevent_id)
    except (TypeError, ValueError):
        return Response(
            {"error": "project_id and subsubevent_id must be integers."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        evaluation = (
            Evaluation.objects.select_related("project", "subsubevent")
            .prefetch_related("judge_marks")
            .get(project_id=project_id, subsubevent_id=subsubevent_id)
        )
    except Evaluation.DoesNotExist:
        return Response({"exists": False}, status=status.HTTP_200_OK)

    marks_payload = [
        {
            "id": mark.id,
            "judge_name": mark.judge_name,
            "mark": str(mark.mark),
            "comments": mark.comments or "",
            "subsubevent_judge_id": mark.subsubevent_judge_id,
        }
        for mark in evaluation.judge_marks.order_by("judge_name")
    ]

    resp = {
        "exists": True,
        "evaluation": {
            "id": evaluation.id,
            "project_id": evaluation.project_id,
            "subsubevent_id": evaluation.subsubevent_id,
            "is_disqualified": evaluation.is_disqualified,
            "remarks": evaluation.remarks or "",
            "number_of_judges": evaluation.number_of_judges,
            "total": str(evaluation.total) if evaluation.total is not None else None,
            "final_score": str(evaluation.final_score) if evaluation.final_score is not None else None,
            "marks": marks_payload,
        },
    }

    return Response(resp, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticatedOrReadOnly])
def download_evaluation_summary(request, subsubevent_id):
    """Generate CSV containing registrations (and evaluation scores if available)."""

    subsubevent = get_object_or_404(SubSubEvent, id=subsubevent_id)

    projects = (
        Project.objects.filter(event=subsubevent)
        .prefetch_related("members")
        .order_by("team_name", "id")
    )

    evaluations = (
        Evaluation.objects.filter(subsubevent=subsubevent)
        .select_related("project")
        .prefetch_related("judge_marks")
    )
    evaluation_map = {evaluation.project_id: evaluation for evaluation in evaluations}

    judges = list(
        SubSubEventJudge.objects.filter(subsubevent=subsubevent)
        .order_by("order", "name")
        .values_list("name", flat=True)
    )
    seen_judges = set(judges)
    for evaluation in evaluations:
        for mark in evaluation.judge_marks.all():
            if mark.judge_name not in seen_judges:
                judges.append(mark.judge_name)
                seen_judges.add(mark.judge_name)

    csv_buffer = StringIO()
    writer = csv.writer(csv_buffer)

    header = [
        "SubSubEvent",
        "Project ID",
        "Team Name",
        "Project Topic",
        "Captain Name",
        "Captain Email",
        "Captain Phone",
        "Team Members",
        "Registered At",
        "Evaluated",
        "Disqualified",
    ]
    header.extend(judges)
    header.extend(["Total", "Final Score"])
    writer.writerow(header)

    for project in projects:
        evaluation = evaluation_map.get(project.id)
        mark_map = {}
        total_value = ""
        final_value = ""
        evaluated_label = "No"
        disqualified_label = "Not Evaluated"

        if evaluation:
            mark_map = {mark.judge_name: mark for mark in evaluation.judge_marks.all()}
            total_value = str(evaluation.total)
            final_value = str(evaluation.final_score)
            evaluated_label = "Yes"
            disqualified_label = "Yes" if evaluation.is_disqualified else "No"

        member_entries = []
        for member in project.members.all():
            entry = member.name or ""
            if member.email:
                entry = f"{entry} <{member.email}>".strip()
            member_entries.append(entry)
        if not member_entries and isinstance(project.team_members, list):
            member_entries = [str(value) for value in project.team_members]

        row = [
            subsubevent.name,
            project.id,
            project.team_name,
            project.project_topic,
            project.captain_name,
            project.captain_email,
            project.captain_phone,
            "; ".join(filter(None, member_entries)),
            project.submitted_at.isoformat() if project.submitted_at else "",
            evaluated_label,
            disqualified_label,
        ]

        for judge_name in judges:
            mark_entry = mark_map.get(judge_name)
            row.append(str(mark_entry.mark) if mark_entry else "")

        row.append(total_value)
        row.append(final_value)

        writer.writerow(row)

    if not projects:
        row = [subsubevent.name] + [""] * (len(header) - 1)
        writer.writerow(row)

    csv_buffer.seek(0)
    response = HttpResponse(csv_buffer.getvalue(), content_type="text/csv")
    filename = slugify(subsubevent.name) or f"subsubevent-{subsubevent_id}"
    response["Content-Disposition"] = (
        f'attachment; filename="{filename}-registrations.csv"'
    )
    return response

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
    # ---- Basic request-level debug info ----
    try:
        remote_addr = request.META.get("REMOTE_ADDR")
    except Exception:
        remote_addr = None

    logger.debug("submit_evaluation_marks called by user=%s (id=%s) ip=%s",
                 getattr(request.user, "username", None),
                 getattr(request.user, "id", None),
                 remote_addr)
    logger.debug("Request method=%s path=%s content_type=%s",
                 request.method, request.path, request.content_type)
    # Log headers (careful not to log sensitive auth token if present)
    try:
        headers = {k: v for k, v in request.headers.items() if k.lower() not in ("authorization", "cookie")}
        logger.debug("Request headers (sanitized): %s", headers)
    except Exception:
        logger.debug("Could not read request.headers")

    # Log raw body for debugging (may be large; consider removing in prod)
    try:
        raw = request.body.decode("utf-8")
        logger.debug("Raw request body: %s", raw)
    except Exception:
        logger.debug("Could not decode request.body")

    # ---- Serializer validation ----
    serializer = CreateEvaluationSerializer(data=request.data)
    if not serializer.is_valid():
        # Log errors explicitly before raising
        logger.error("CreateEvaluationSerializer.is_valid() failed: errors=%s data=%s",
                     serializer.errors, request.data)
        # re-raise to preserve original behavior (DRF will convert to 400 response)
        raise ValidationError(serializer.errors)

    data = serializer.validated_data
    logger.debug("Serializer validated_data: %s", data)

    # ---- Object lookups with logging ----
    try:
        project = get_object_or_404(Project, id=data["project_id"])
        logger.debug("Found project id=%s", project.id)
    except Exception as exc:
        logger.exception("Failed to get Project with id=%s", data.get("project_id"))
        raise

    try:
        subsub = get_object_or_404(SubSubEvent, id=data["subsubevent_id"])
        logger.debug("Found SubSubEvent id=%s", subsub.id)
    except Exception as exc:
        logger.exception("Failed to get SubSubEvent with id=%s", data.get("subsubevent_id"))
        raise

    # ---- Atomic create/update and per-mark debug ----
    created_marks = []
    try:
        with transaction.atomic():
            evaluation, created = Evaluation.objects.get_or_create(
                project=project,
                subsubevent=subsub,
                defaults={
                    "is_disqualified": data.get("is_disqualified", False),
                    "remarks": data.get("remarks", "") or "",
                },
            )
            if created:
                logger.info("Created new Evaluation id=%s for project=%s subsub=%s",
                            evaluation.id, project.id, subsub.id)
            else:
                logger.info("Using existing Evaluation id=%s for project=%s subsub=%s (clearing existing marks)",
                            evaluation.id, project.id, subsub.id)
                # optional: clear existing marks to overwrite
                deleted_count, _ = evaluation.judge_marks.all().delete()
                logger.debug("Deleted %d existing EvaluationJudgeMark rows for evaluation id=%s",
                             deleted_count, evaluation.id)
                evaluation.is_disqualified = data.get("is_disqualified", evaluation.is_disqualified)
                evaluation.remarks = data.get("remarks", evaluation.remarks)
                evaluation.save(update_fields=["is_disqualified", "remarks"])

            marks_input = data.get("marks", [])
            if not isinstance(marks_input, (list, tuple)):
                logger.error("marks must be a list/tuple, got: %s", type(marks_input))
                raise ValidationError({"marks": "Expected a list of mark objects."})

            for idx, mi in enumerate(marks_input, start=1):
                logger.debug("Processing mark #%d: %s", idx, mi)
                judge_name = (mi.get("judge_name") or "").strip()
                if not judge_name:
                    logger.error("Empty judge_name at marks index %d: %s", idx, mi)
                    raise ValidationError({"marks": {idx - 1: {"judge_name": "This field may not be blank."}}})

                # Parse/validate mark value robustly
                raw_mark = mi.get("mark")
                if raw_mark in (None, ""):
                    logger.error("Missing mark value for judge '%s' at index %d", judge_name, idx)
                    raise ValidationError({"marks": {idx - 1: {"mark": "This field is required."}}})
                try:
                    # Ensure string conversion so Decimal doesn't interpret floats unexpectedly
                    mark_decimal = Decimal(str(raw_mark))
                except (InvalidOperation, ValueError, TypeError) as exc:
                    logger.exception("Invalid mark for judge '%s' at index %d: raw_mark=%r", judge_name, idx, raw_mark)
                    raise ValidationError({"marks": {idx - 1: {"mark": f"Invalid numeric value: {raw_mark}"}}})

                comments = mi.get("comments", "") or ""

                # try to link to a SubSubEventJudge if exists
                try:
                    ssj = SubSubEventJudge.objects.filter(subsubevent=subsub, name=judge_name).first()
                    logger.debug("Linked SubSubEventJudge for name='%s': %s", judge_name, getattr(ssj, "id", None))
                except Exception:
                    logger.exception("Error querying SubSubEventJudge for name='%s'", judge_name)
                    ssj = None

                # create EvaluationJudgeMark
                ejm = EvaluationJudgeMark.objects.create(
                    evaluation=evaluation,
                    subsubevent_judge=ssj,
                    judge_name=judge_name,
                    mark=mark_decimal,
                    comments=comments,
                )
                created_marks.append({"id": ejm.id, "judge_name": ejm.judge_name, "mark": str(ejm.mark)})
                logger.info("Created EvaluationJudgeMark id=%s judge=%s mark=%s", ejm.id, ejm.judge_name, ejm.mark)

            # recompute totals/average and save on evaluation
            try:
                evaluation.recalculate_scores()
                evaluation.save()
                logger.debug("Recalculated evaluation scores: total=%s final_score=%s number_of_judges=%s",
                             getattr(evaluation, "total", None),
                             getattr(evaluation, "final_score", None),
                             getattr(evaluation, "number_of_judges", None))
            except Exception:
                logger.exception("Failed to recalculate/save evaluation id=%s", evaluation.id)
                # re-raise to rollback transaction
                raise

    except ValidationError:
        # already logged specifics above, re-raise to return DRF 400 response
        raise
    except Exception:
        # Log unexpected exceptions (with stack trace) then re-raise so middleware/DRF handles it
        logger.exception("Unexpected error in submit_evaluation_marks")
        raise

    # return created evaluation summary
    resp = {
        "evaluation_id": evaluation.id,
        "project_id": project.id,
        "subsubevent_id": subsub.id,
        "number_of_judges": evaluation.number_of_judges,
        "total": str(evaluation.total) if evaluation.total is not None else None,
        "final_score": str(evaluation.final_score) if evaluation.final_score is not None else None,
        "is_disqualified": evaluation.is_disqualified,
        "marks_created": created_marks,
    }
    logger.debug("submit_evaluation_marks completed successfully: %s", resp)
    return Response(resp, status=status.HTTP_201_CREATED)