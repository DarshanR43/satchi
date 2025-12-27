from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from events.models import MainEvent, SubEvent, SubSubEvent
from users.models import User, EventUserMapping
from api.models import Project, TeamMember
from api.serializers import ProjectSerializer
from eval.models import Evaluation

from django.db import transaction, IntegrityError
from django.db.models import Exists, OuterRef
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
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
    LegacyRegistrationSerializer,
)


PRIVILEGED_ROLES = {
    User.Role.SUPERADMIN,
    User.Role.EVENTADMIN,
    User.Role.SUBEVENTADMIN,
    User.Role.SUBEVENTMANAGER,
    User.Role.SUBSUBEVENTMANAGER,
    User.Role.EVENTMANAGER,
    User.Role.COORDINATOR,
}

MAIN_TREE_ROLES = {
    User.Role.SUPERADMIN,
    User.Role.EVENTADMIN,
    User.Role.EVENTMANAGER,
}

SUB_TREE_ROLES = {
    User.Role.SUPERADMIN,
    User.Role.EVENTADMIN,
    User.Role.EVENTMANAGER,
    User.Role.SUBEVENTADMIN,
    User.Role.SUBEVENTMANAGER,
}


def _build_event_scope(user):
    if not user.is_authenticated:
        return {
            "main_ids": set(),
            "sub_ids": set(),
            "subsub_ids": set(),
            "full_main_ids": set(),
            "full_sub_ids": set(),
        }

    if user.is_superuser or getattr(user, "role", None) == User.Role.SUPERADMIN:
        main_ids = set(MainEvent.objects.values_list("id", flat=True))
        sub_ids = set(SubEvent.objects.values_list("id", flat=True))
        subsub_ids = set(SubSubEvent.objects.values_list("id", flat=True))
        return {
            "main_ids": main_ids,
            "sub_ids": sub_ids,
            "subsub_ids": subsub_ids,
            "full_main_ids": set(main_ids),
            "full_sub_ids": set(sub_ids),
        }

    mappings = list(
        EventUserMapping.objects.filter(user=user)
        .select_related(
            "main_event",
            "sub_event",
            "sub_event__parent_event",
            "sub_sub_event",
            "sub_sub_event__parent_event",
            "sub_sub_event__parent_subevent",
        )
    )

    main_ids = set()
    sub_ids = set()
    subsub_ids = set()
    full_main_ids = set()
    full_sub_ids = set()

    for mapping in mappings:
        if mapping.main_event_id:
            main_id = mapping.main_event_id
            main_ids.add(main_id)
            if mapping.user_role in MAIN_TREE_ROLES:
                full_main_ids.add(main_id)

        if mapping.sub_event_id and mapping.sub_event:
            sub = mapping.sub_event
            sub_id = sub.id
            sub_ids.add(sub_id)
            main_ids.add(sub.parent_event_id)
            if mapping.user_role in SUB_TREE_ROLES:
                full_sub_ids.add(sub_id)
            if mapping.user_role in MAIN_TREE_ROLES:
                full_main_ids.add(sub.parent_event_id)

        if mapping.sub_sub_event_id and mapping.sub_sub_event:
            subsub = mapping.sub_sub_event
            subsub_id = subsub.id
            subsub_ids.add(subsub_id)
            sub_ids.add(subsub.parent_subevent_id)
            main_ids.add(subsub.parent_event_id)
            if mapping.user_role in SUB_TREE_ROLES:
                full_sub_ids.add(subsub.parent_subevent_id)
            if mapping.user_role in MAIN_TREE_ROLES:
                full_main_ids.add(subsub.parent_event_id)

    if full_main_ids:
        sub_ids.update(
            SubEvent.objects.filter(parent_event_id__in=full_main_ids).values_list("id", flat=True)
        )
        subsub_ids.update(
            SubSubEvent.objects.filter(parent_event_id__in=full_main_ids).values_list("id", flat=True)
        )

    if full_sub_ids:
        subsub_ids.update(
            SubSubEvent.objects.filter(parent_subevent_id__in=full_sub_ids).values_list("id", flat=True)
        )

    main_ids |= full_main_ids
    sub_ids |= full_sub_ids

    return {
        "main_ids": main_ids,
        "sub_ids": sub_ids,
        "subsub_ids": subsub_ids,
        "full_main_ids": full_main_ids,
        "full_sub_ids": full_sub_ids,
    }

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_main_events(request):
    if request.method == 'POST':
        scope = _build_event_scope(request.user)
        main_ids = scope["main_ids"]

        if not main_ids:
            return Response([], status=status.HTTP_200_OK)

        main_events = MainEvent.objects.filter(id__in=main_ids).order_by("name")
        event_list = []
        for event in main_events:
            event_list.append({
                'id': event.id,
                'name': event.name,
                'description': event.description
            })
        return Response(event_list, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_subevents(request, main_event_id):
    if request.method == 'POST':
        try:
            main_event = MainEvent.objects.get(id=main_event_id)
        except MainEvent.DoesNotExist:
            return Response({"error": "Main event not found."}, status=status.HTTP_404_NOT_FOUND)

        scope = _build_event_scope(request.user)
        if main_event_id not in scope["main_ids"]:
            return Response({"error": "You are not authorized for this main event."}, status=status.HTTP_403_FORBIDDEN)

        if main_event_id in scope["full_main_ids"]:
            subevents = SubEvent.objects.filter(parent_event=main_event)
        else:
            subevents = SubEvent.objects.filter(parent_event=main_event, id__in=scope["sub_ids"])

        subevent_list = []
        for subevent in subevents.order_by("name"):
            subevent_list.append({
                'id': subevent.id,
                'name': subevent.name,
                'description': subevent.description
            })
        return Response(subevent_list, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_subsubevents(request, sub_event_id):
    if request.method == 'POST':
        try:
            sub_event = SubEvent.objects.select_related("parent_event").get(id=sub_event_id)
        except SubEvent.DoesNotExist:
            return Response({"error": "Sub event not found."}, status=status.HTTP_404_NOT_FOUND)

        scope = _build_event_scope(request.user)
        parent_main_id = sub_event.parent_event_id
        if sub_event_id not in scope["sub_ids"] and parent_main_id not in scope["full_main_ids"]:
            return Response({"error": "You are not authorized for this sub-event."}, status=status.HTTP_403_FORBIDDEN)

        if sub_event_id in scope["full_sub_ids"] or parent_main_id in scope["full_main_ids"]:
            subsubevents = SubSubEvent.objects.filter(parent_subevent=sub_event)
        else:
            subsubevents = SubSubEvent.objects.filter(parent_subevent=sub_event, id__in=scope["subsub_ids"])

        subsubevent_list = []
        for subsubevent in subsubevents.order_by("name"):
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
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_legacy_registration(request):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication required."}, status=status.HTTP_403_FORBIDDEN)

    user_role = getattr(request.user, "role", None)
    if not (getattr(request.user, "is_superuser", False) or user_role in PRIVILEGED_ROLES):
        return Response(
            {"detail": "You are not authorized to record legacy registrations."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = LegacyRegistrationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payload = serializer.validated_data

    subsubevent = get_object_or_404(SubSubEvent, id=payload["subsubevent_id"])
    project_payload = payload.get("project", {})
    team_members_payload = project_payload.get("team_members") or []
    submitted_at_override = project_payload.get("submitted_at")

    team_name = (project_payload.get("team_name") or "").strip()
    project_topic = (project_payload.get("project_topic") or "").strip()
    captain_email = (project_payload.get("captain_email") or "").strip().lower()
    captain_name = (project_payload.get("captain_name") or "").strip()
    captain_phone = (project_payload.get("captain_phone") or "").strip()
    faculty_mentor = (project_payload.get("faculty_mentor_name") or "").strip()

    required_values = {
        "team_name": team_name,
        "project_topic": project_topic,
        "captain_name": captain_name,
        "captain_email": captain_email,
    }
    missing_fields = {field: "This field is required." for field, value in required_values.items() if not value}
    if missing_fields:
        raise ValidationError({"project": missing_fields})

    team_members_json = []
    member_entries = []

    for raw_member in team_members_payload:
        name = (raw_member.get("name") or "").strip()
        email = (raw_member.get("email") or "").strip().lower()
        phone = (raw_member.get("phone") or "").strip()

        label_parts = []
        if name:
            label_parts.append(name)
        if email:
            label_parts.append(f"<{email}>")
        if label_parts:
            team_members_json.append(" ".join(label_parts))

        if name or email or phone:
            member_entries.append({
                "name": name or "Unknown",
                "email": email,
                "phone": phone,
            })

    member_entries.insert(0, {
        "name": captain_name or "Team Captain",
        "email": captain_email,
        "phone": captain_phone,
    })

    seen_members = set()
    cleaned_member_entries = []
    for entry in member_entries:
        if not any([entry.get("name"), entry.get("email"), entry.get("phone")]):
            continue
        key = (entry.get("email") or entry.get("name"), entry.get("phone"))
        if key in seen_members:
            continue
        seen_members.add(key)
        cleaned_member_entries.append({
            "name": entry.get("name") or "Unknown",
            "email": entry.get("email") or "",
            "phone": entry.get("phone") or "",
        })

    team_member_count = len(cleaned_member_entries)
    min_team_size = getattr(subsubevent, "minTeamSize", None) or 1
    max_team_size_raw = getattr(subsubevent, "maxTeamSize", None)
    max_team_size = max_team_size_raw if max_team_size_raw else None

    if team_member_count < min_team_size:
        raise ValidationError({
            "project": {
                "team_members": f"At least {min_team_size} participants are required; received {team_member_count}.",
            }
        })

    if max_team_size and team_member_count > max_team_size:
        raise ValidationError({
            "project": {
                "team_members": f"No more than {max_team_size} participants are allowed; received {team_member_count}.",
            }
        })

    with transaction.atomic():
        project = Project.objects.create(
            event=subsubevent,
            team_name=team_name,
            project_topic=project_topic,
            captain_name=captain_name,
            captain_email=captain_email,
            captain_phone=captain_phone,
            team_members=team_members_json,
            faculty_mentor_name=faculty_mentor,
        )

        if submitted_at_override:
            project.submitted_at = submitted_at_override
            project.save(update_fields=["submitted_at"])

        if cleaned_member_entries:
            TeamMember.objects.bulk_create([
                TeamMember(
                    name=entry["name"],
                    email=entry["email"],
                    phone=entry["phone"],
                    project=project,
                )
                for entry in cleaned_member_entries
            ])

        evaluation_payload = payload.get("evaluation")
        evaluation_summary = None
        if evaluation_payload:
            marks_payload = evaluation_payload.get("marks") or []
            evaluation = Evaluation.objects.create(
                project=project,
                subsubevent=subsubevent,
                is_disqualified=evaluation_payload.get("is_disqualified", False),
                remarks=evaluation_payload.get("remarks", "") or "",
            )

            marks_to_create = []
            for idx, mark in enumerate(marks_payload, start=1):
                judge_name = (mark.get("judge_name") or "").strip()
                subsubevent_judge = None
                judge_id = mark.get("subsubevent_judge_id")
                if judge_id is not None:
                    subsubevent_judge = SubSubEventJudge.objects.filter(
                        id=judge_id,
                        subsubevent=subsubevent,
                    ).first()
                    if subsubevent_judge and not judge_name:
                        judge_name = subsubevent_judge.name
                if not judge_name:
                    raise ValidationError({"evaluation": {"marks": {idx - 1: {"judge_name": "This field is required."}}}})

                marks_to_create.append(
                    EvaluationJudgeMark(
                        evaluation=evaluation,
                        subsubevent_judge=subsubevent_judge,
                        judge_name=judge_name,
                        mark=mark.get("mark"),
                        comments=mark.get("comments", "") or "",
                    )
                )

            if marks_to_create:
                EvaluationJudgeMark.objects.bulk_create(marks_to_create)
                evaluation.recalculate_scores()
                evaluation.save(update_fields=["number_of_judges", "total", "final_score", "is_disqualified", "remarks"])

            evaluation_summary = {
                "id": evaluation.id,
                "number_of_judges": evaluation.number_of_judges,
                "total": str(evaluation.total),
                "final_score": str(evaluation.final_score),
                "is_disqualified": evaluation.is_disqualified,
            }

    response_payload = {
        "message": "Legacy registration recorded successfully.",
        "project": {
            "id": project.id,
            "team_name": project.team_name,
            "subsubevent_id": subsubevent.id,
            "team_size": team_member_count,
            "min_team_size": min_team_size,
            "max_team_size": max_team_size,
        },
        "evaluation": evaluation_summary,
    }

    return Response(response_payload, status=status.HTTP_201_CREATED)