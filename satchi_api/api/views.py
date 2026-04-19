from collections import Counter

from django.db import transaction
from django.db.models import Avg, Max, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from eval.models import Evaluation
from events.models import SubSubEvent
from users.models import EventUserMapping, User

from .models import Project, TeamMember
from .serializers import ProjectSerializer
from .services import sync_project_participants

MANAGE_ROLES = {
    User.Role.SUPERADMIN,
    User.Role.EVENTADMIN,
    User.Role.SUBEVENTADMIN,
    User.Role.EVENTMANAGER,
    User.Role.SUBEVENTMANAGER,
    User.Role.SUBSUBEVENTMANAGER,
}
PROJECT_CATEGORY_LABELS = dict(Project.PROJECT_CATEGORIES)
PROJECT_CATEGORY_ALIASES = {
    **{value: value for value in PROJECT_CATEGORY_LABELS},
    **{value.lower(): value for value in PROJECT_CATEGORY_LABELS},
    **{label.lower(): value for value, label in PROJECT_CATEGORY_LABELS.items()},
}


def _normalize_email(value):
    return (value or "").strip().lower()


def _normalize_phone(value):
    return (value or "").strip()


def _display_member_name(name, email):
    if name:
        return name.strip()
    if email:
        local_part = email.split("@")[0]
        return " ".join(part.capitalize() for part in local_part.replace(".", " ").replace("_", " ").split())
    return "Unknown"


def _normalize_member_entries(raw_members):
    normalized = []
    for index, raw_member in enumerate(raw_members or [], start=1):
        if isinstance(raw_member, str):
            email = _normalize_email(raw_member)
            if not email:
                continue
            normalized.append(
                {
                    "name": "",
                    "email": email,
                    "phone": "",
                }
            )
            continue

        if not isinstance(raw_member, dict):
            raise ValueError(f"Team member #{index} is invalid.")

        name = (raw_member.get("name") or "").strip()
        email = _normalize_email(raw_member.get("email"))
        phone = _normalize_phone(raw_member.get("phone"))

        if not any([name, email, phone]):
            continue

        if not email:
            raise ValueError(f"Team member #{index} must include an email address.")

        normalized.append(
            {
                "name": name,
                "email": email,
                "phone": phone,
            }
        )
    return normalized


def _normalize_sdgs(raw_sdgs):
    if raw_sdgs in (None, ""):
        return []

    values = raw_sdgs if isinstance(raw_sdgs, (list, tuple, set)) else [raw_sdgs]
    normalized = []
    seen = set()

    for raw_value in values:
        try:
            sdg = int(raw_value)
        except (TypeError, ValueError):
            raise ValueError("SDGs must be numbers between 1 and 17.")

        if sdg < 1 or sdg > 17:
            raise ValueError("SDGs must be numbers between 1 and 17.")

        if sdg not in seen:
            normalized.append(sdg)
            seen.add(sdg)

    return normalized


def _normalize_trl_level(raw_trl_level):
    if raw_trl_level in (None, ""):
        raise ValueError("TRL level is required.")

    try:
        trl_level = int(raw_trl_level)
    except (TypeError, ValueError):
        raise ValueError("TRL level must be a number between 1 and 9.")

    if trl_level < 1 or trl_level > 9:
        raise ValueError("TRL level must be a number between 1 and 9.")

    return trl_level


def _normalize_project_category(raw_project_category):
    value = str(raw_project_category or "").strip()
    if not value:
        raise ValueError("Project category is required.")

    normalized = PROJECT_CATEGORY_ALIASES.get(value) or PROJECT_CATEGORY_ALIASES.get(value.lower())
    if not normalized:
        raise ValueError("Project category must be Hardware or Software.")

    return normalized


def _user_can_manage_event(user, event):
    if not user or not user.is_authenticated:
        return False

    if user.is_superuser or user.role == User.Role.SUPERADMIN:
        return True

    return EventUserMapping.objects.filter(
        user=user,
        user_role__in=MANAGE_ROLES,
    ).filter(
        Q(main_event=event.parent_event)
        | Q(sub_event=event.parent_subevent)
        | Q(sub_sub_event=event)
    ).exists()


def _member_payload(member):
    return {
        "id": member.id,
        "name": member.name,
        "email": member.email,
        "phone": member.phone,
        "userId": member.user_id,
    }


def _legacy_member_payload(raw_member):
    if isinstance(raw_member, dict):
        return {
            "name": (raw_member.get("name") or "").strip(),
            "email": _normalize_email(raw_member.get("email")),
            "phone": _normalize_phone(raw_member.get("phone")),
            "userId": None,
        }
    return {
        "name": _display_member_name("", raw_member),
        "email": _normalize_email(raw_member),
        "phone": "",
        "userId": None,
    }


def _project_member_payload(project):
    members = []
    captain_email = _normalize_email(project.captain_email)
    seen_emails = set()

    for member in project.members.all():
        member_email = _normalize_email(member.email)
        if member_email == captain_email or member_email in seen_emails:
            continue
        seen_emails.add(member_email)
        members.append(_member_payload(member))

    if members:
        return members

    if isinstance(project.team_members, list):
        for raw_member in project.team_members:
            payload = _legacy_member_payload(raw_member)
            member_email = _normalize_email(payload.get("email"))
            if not member_email or member_email == captain_email or member_email in seen_emails:
                continue
            seen_emails.add(member_email)
            members.append(payload)

    return members


def _serialize_registration(project, viewer):
    subsub_event = project.event
    sub_event = getattr(subsub_event, "parent_subevent", None)
    main_event = getattr(subsub_event, "parent_event", None)
    viewer_email = _normalize_email(getattr(viewer, "email", None))
    is_captain = bool(
        (project.captain_user_id and viewer and project.captain_user_id == viewer.id)
        or (viewer_email and viewer_email == _normalize_email(project.captain_email))
    )

    return {
        "projectId": project.id,
        "teamName": project.team_name,
        "projectTopic": project.project_topic,
        "projectCategory": project.project_category,
        "trlLevel": project.trl_level,
        "sdgs": project.sdgs or [],
        "facultyMentorName": project.faculty_mentor_name,
        "role": "Captain" if is_captain else "Team Member",
        "registeredAt": project.submitted_at.isoformat() if project.submitted_at else None,
        "captain": {
            "name": project.captain_name,
            "email": project.captain_email,
            "phone": project.captain_phone,
            "userId": project.captain_user_id,
        },
        "teamMembers": _project_member_payload(project),
        "event": {
            "id": subsub_event.id,
            "eventId": subsub_event.event_id,
            "name": subsub_event.name,
            "description": subsub_event.description,
        },
        "subEvent": {
            "id": sub_event.id if sub_event else None,
            "name": sub_event.name if sub_event else None,
        },
        "mainEvent": {
            "id": main_event.id if main_event else None,
            "name": main_event.name if main_event else None,
        },
    }


def _statistics_project_payload(project, evaluation_map):
    evaluation = evaluation_map.get(project.id)
    return {
        "projectId": project.id,
        "teamName": project.team_name,
        "projectTopic": project.project_topic,
        "projectCategory": project.project_category,
        "trlLevel": project.trl_level,
        "sdgs": project.sdgs or [],
        "facultyMentorName": project.faculty_mentor_name,
        "captain": {
            "name": project.captain_name,
            "email": project.captain_email,
            "phone": project.captain_phone,
        },
        "teamMembers": _project_member_payload(project),
        "registeredAt": project.submitted_at.isoformat() if project.submitted_at else None,
        "isEvaluated": bool(evaluation),
        "finalScore": float(evaluation.final_score) if evaluation and evaluation.final_score is not None else None,
    }


def _serialize_event_summary(event):
    return {
        "id": event.id,
        "eventId": event.event_id,
        "name": event.name,
        "description": event.description,
        "rules": event.rules,
        "minTeamSize": event.minTeamSize,
        "maxTeamSize": event.maxTeamSize,
        "minFemaleParticipants": event.minFemaleParticipants,
        "isFacultyMentorRequired": event.isFacultyMentorRequired,
    }


def _parse_project_submission_data(data):
    payload = {
        "team_name": (data.get('team_name') or '').strip(),
        "project_topic": (data.get('project_topic') or '').strip(),
        "project_category": _normalize_project_category(data.get('project_category')),
        "captain_name": (data.get('captain_name') or '').strip(),
        "captain_email": _normalize_email(data.get('captain_email')),
        "captain_phone": _normalize_phone(data.get('captain_phone')),
        "faculty_mentor_name": (data.get('faculty_mentor_name') or '').strip() or None,
    }

    payload["team_members"] = _normalize_member_entries(data.get('team_members', []))
    payload["trl_level"] = _normalize_trl_level(data.get('trl_level'))
    payload["sdgs"] = _normalize_sdgs(data.get('sdgs', []))

    if not payload["team_name"] or not payload["project_topic"] or not payload["captain_name"] or not payload["captain_email"] or not payload["captain_phone"]:
        raise ValueError("Missing required fields.")

    if not payload["sdgs"]:
        raise ValueError("Select at least one SDG for the project.")

    return payload


def _validate_project_submission_constraints(event, payload, requester, is_manual_entry=False, current_project=None):
    requester_email = _normalize_email(getattr(requester, "email", None))
    if not is_manual_entry and payload["captain_email"] != requester_email:
        return Response(
            {"error": "You can only register a team where you are the captain."},
            status=status.HTTP_403_FORBIDDEN,
        )

    team_size = len(payload["team_members"]) + 1
    if team_size < event.minTeamSize:
        return Response(
            {"error": f"Team size is less than the minimum required size of {event.minTeamSize}."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if team_size > event.maxTeamSize:
        return Response(
            {"error": f"Team size exceeds the maximum allowed size of {event.maxTeamSize}."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if event.isFacultyMentorRequired and not payload["faculty_mentor_name"]:
        return Response({"error": "Faculty mentor name is required."}, status=status.HTTP_400_BAD_REQUEST)

    participant_emails = [payload["captain_email"]] + [_normalize_email(member['email']) for member in payload["team_members"]]
    if len(participant_emails) != len(set(participant_emails)):
        return Response({"error": "Duplicate email addresses found in the team."}, status=status.HTTP_400_BAD_REQUEST)

    for email in participant_emails:
        team_member_conflicts = TeamMember.objects.filter(email__iexact=email)
        captain_conflicts = Project.objects.filter(captain_email__iexact=email)

        if current_project is not None:
            team_member_conflicts = team_member_conflicts.exclude(project=current_project)
            captain_conflicts = captain_conflicts.exclude(pk=current_project.pk)

        if team_member_conflicts.exists() or captain_conflicts.exists():
            return Response({"error": f"Email {email} is already registered in another project."}, status=status.HTTP_400_BAD_REQUEST)

    return None


def _apply_project_submission(project, payload, created_by=None):
    project.team_name = payload["team_name"]
    project.project_topic = payload["project_topic"]
    project.project_category = payload["project_category"]
    project.trl_level = payload["trl_level"]
    project.sdgs = payload["sdgs"]
    project.captain_name = payload["captain_name"]
    project.captain_email = payload["captain_email"]
    project.captain_phone = payload["captain_phone"]
    project.team_members = payload["team_members"]
    project.faculty_mentor_name = payload["faculty_mentor_name"]

    update_fields = [
        "team_name",
        "project_topic",
        "project_category",
        "trl_level",
        "sdgs",
        "captain_name",
        "captain_email",
        "captain_phone",
        "team_members",
        "faculty_mentor_name",
    ]

    if created_by is not None and project.created_by_id != created_by.id:
        project.created_by = created_by
        update_fields.append("created_by")

    project.save(update_fields=update_fields)
    sync_project_participants(project)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def submit_project(request, event_id):
    event = get_object_or_404(SubSubEvent, event_id=event_id)

    try:
        payload = _parse_project_submission_data(request.data)
    except ValueError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    is_manual_entry = _user_can_manage_event(request.user, event)
    validation_error = _validate_project_submission_constraints(
        event=event,
        payload=payload,
        requester=request.user,
        is_manual_entry=is_manual_entry,
    )
    if validation_error is not None:
        return validation_error

    project = Project.objects.create(
        event=event,
        created_by=request.user,
        team_name=payload["team_name"],
        project_topic=payload["project_topic"],
        project_category=payload["project_category"],
        trl_level=payload["trl_level"],
        sdgs=payload["sdgs"],
        captain_name=payload["captain_name"],
        captain_email=payload["captain_email"],
        captain_phone=payload["captain_phone"],
        team_members=payload["team_members"],
        faculty_mentor_name=payload["faculty_mentor_name"],
    )
    sync_project_participants(project)

    serialized_project = ProjectSerializer(project).data
    return Response(
        {
            "message": "Project submitted successfully.",
            "project": serialized_project,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def event_registrations(request, event_pk):
    event = get_object_or_404(SubSubEvent, pk=event_pk)
    if not _user_can_manage_event(request.user, event):
        return Response({"error": "Unauthorized Access"}, status=status.HTTP_403_FORBIDDEN)

    projects = (
        Project.objects.filter(event=event)
        .prefetch_related('members')
        .order_by('team_name', 'id')
    )
    evaluations = Evaluation.objects.filter(subsubevent=event).select_related('project')
    evaluation_map = {evaluation.project_id: evaluation for evaluation in evaluations}

    return Response(
        {
            "event": _serialize_event_summary(event),
            "projects": [_statistics_project_payload(project, evaluation_map) for project in projects],
        },
        status=status.HTTP_200_OK,
    )


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def manage_event_registration(request, event_pk, project_id):
    event = get_object_or_404(SubSubEvent, pk=event_pk)
    if not _user_can_manage_event(request.user, event):
        return Response({"error": "Unauthorized Access"}, status=status.HTTP_403_FORBIDDEN)

    project = get_object_or_404(Project.objects.prefetch_related('members'), pk=project_id, event=event)

    if request.method == 'DELETE':
        team_name = project.team_name
        project.delete()
        return Response(
            {"message": f'Team "{team_name}" deleted successfully.'},
            status=status.HTTP_200_OK,
        )

    try:
        payload = _parse_project_submission_data(request.data)
    except ValueError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    validation_error = _validate_project_submission_constraints(
        event=event,
        payload=payload,
        requester=request.user,
        is_manual_entry=True,
        current_project=project,
    )
    if validation_error is not None:
        return validation_error

    _apply_project_submission(project, payload, created_by=project.created_by or request.user)
    refreshed_project = Project.objects.prefetch_related('members').get(pk=project.pk)

    return Response(
        {
            "message": "Team updated successfully.",
            "project": _statistics_project_payload(refreshed_project, {}),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_registrations(request):
    email = _normalize_email(request.user.email)
    if not email:
        return Response({"registrations": []}, status=status.HTTP_200_OK)

    projects = (
        Project.objects.filter(
            Q(captain_user=request.user)
            | Q(captain_email__iexact=email)
            | Q(members__user=request.user)
            | Q(members__email__iexact=email)
        )
        .select_related(
            'event',
            'event__parent_subevent',
            'event__parent_event',
            'captain_user',
        )
        .prefetch_related('members')
        .distinct()
        .order_by('-submitted_at', '-id')
    )

    payload = [_serialize_registration(project, request.user) for project in projects if project.event]
    return Response({"registrations": payload}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_event_statistics(request, event_id):
    event = get_object_or_404(SubSubEvent, event_id=event_id)
    if not _user_can_manage_event(request.user, event):
        return Response({"error": "Unauthorized Access"}, status=status.HTTP_403_FORBIDDEN)

    projects = (
        Project.objects.filter(event=event)
        .prefetch_related('members')
        .order_by('team_name', 'id')
    )
    evaluations = Evaluation.objects.filter(subsubevent=event).select_related('project')
    evaluation_map = {evaluation.project_id: evaluation for evaluation in evaluations}

    marks = [float(mark) for mark in evaluations.values_list('final_score', flat=True)]
    avg_mark = evaluations.aggregate(Avg('final_score'))['final_score__avg'] or 0
    max_mark = evaluations.aggregate(Max('final_score'))['final_score__max'] or 0

    trl_counter = Counter()
    project_category_counter = Counter()
    sdg_counter = Counter()
    total_participants = 0
    project_payload = []

    for project in projects:
        total_participants += 1 + len(_project_member_payload(project))
        if project.project_category:
            project_category_counter[project.project_category] += 1
        if project.trl_level:
            trl_counter[project.trl_level] += 1
        for sdg in project.sdgs or []:
            sdg_counter[int(sdg)] += 1
        project_payload.append(_statistics_project_payload(project, evaluation_map))

    trl_breakdown = [
        {"trlLevel": level, "count": trl_counter.get(level, 0)}
        for level in range(1, 10)
    ]
    project_category_breakdown = [
        {
            "category": category,
            "label": label,
            "count": project_category_counter.get(category, 0),
        }
        for category, label in Project.PROJECT_CATEGORIES
    ]
    sdg_breakdown = [
        {"sdg": sdg, "count": sdg_counter.get(sdg, 0)}
        for sdg in range(1, 18)
    ]

    return Response(
        {
            "eventName": event.name,
            "totalProjects": len(project_payload),
            "totalParticipants": total_participants,
            "evaluatedProjects": evaluations.count(),
            "averageMark": round(float(avg_mark), 2) if avg_mark else 0,
            "highestMark": float(max_mark) if max_mark else 0,
            "marks": marks,
            "projectCategoryBreakdown": project_category_breakdown,
            "trlBreakdown": trl_breakdown,
            "sdgBreakdown": sdg_breakdown,
            "projects": project_payload,
        },
        status=status.HTTP_200_OK,
    )
