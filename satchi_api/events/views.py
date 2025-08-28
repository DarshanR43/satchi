from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.decorators import api_view,permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import MainEvent, SubEvent, SubSubEvent
from users.models import User, EventUserMapping  # adjust app label if different
from rest_framework.permissions import IsAuthenticated
from users.services.roles import promote_user_if_higher

@api_view(["POST"])
@transaction.atomic
def create_event(request):
    """
    Body:
    {
      "eventType": "main" | "sub" | "subsub",
      "parentId": <main id>,        # for sub/subsub
      "subParentId": <sub id>,      # for subsub
      "name": "string",
      "description": "string",

      # subsub-only extras (optional):
      "rules": "string",
      "minMembers": 1,
      "maxMembers": 5,
      "minFemaleMembers": 0,
      "facultyMentor": false
    }
    """
    data = request.data
    etype = (data.get("eventType") or "").lower()
    name = (data.get("name") or "").strip()
    description = data.get("description") or ""

    if not etype or not name:
        return Response({"error": "eventType and name are required."}, status=400)

    if etype == "main":
        obj = MainEvent.objects.create(name=name, description=description)
        # your logic: creator mapped as SUPERADMIN at main
        EventUserMapping.objects.create(
            user=request.user,
            main_event=obj,
            user_role=User.Role.SUPERADMIN,
        )
        return Response({"id": obj.id, "level": "main"}, status=201)

    if etype == "sub":
        main = get_object_or_404(MainEvent, pk=data.get("parentId"))
        obj = SubEvent.objects.create(parent_event=main, name=name, description=description)
        # your logic: EVENTADMIN unless superuser => SUPERADMIN
        EventUserMapping.objects.create(
            user=request.user,
            sub_event=obj,
            user_role=User.Role.EVENTADMIN if not request.user.is_superuser else User.Role.SUPERADMIN,
        )
        return Response({"id": obj.id, "level": "sub"}, status=201)

    if etype in ("subsub", "sub_sub"):
        main = get_object_or_404(MainEvent, pk=data.get("parentId"))
        sub = get_object_or_404(SubEvent, pk=data.get("subParentId"), parent_event=main)

        obj = SubSubEvent.objects.create(
            parent_event=main,
            parent_subevent=sub,
            name=name,
            description=description,
            rules=data.get("rules") or "",
            minTeamSize=int(data.get("minMembers") or 1),
            maxTeamSize=int(data.get("maxMembers") or 1),
            minFemaleParticipants=int(data.get("minFemaleMembers") or 0),
            isFacultyMentorRequired=bool(data.get("facultyMentor")),
        )
        # your logic: SUPERADMIN if superuser else SUBEVENTADMIN,
        # but if user's role is EVENTADMIN, keep EVENTADMIN
        role = User.Role.SUBEVENTADMIN if not request.user.is_superuser else User.Role.SUPERADMIN
        EventUserMapping.objects.create(
            user=request.user,
            sub_sub_event=obj,
            user_role=role if request.user.role != User.Role.EVENTADMIN else User.Role.EVENTADMIN,
        )
        return Response({"id": obj.id, "level": "subsub"}, status=201)

    return Response({"error": "Invalid eventType. Use main | sub | subsub."}, status=400)

@api_view(["DELETE"])
@transaction.atomic
def delete_event(request, level: str, pk: int):
    """
    DELETE /api/delete_event/<level>/<pk>/
    level: main | sub | subsub
    """
    lvl = (level or "").lower()
    if lvl == "main":
        get_object_or_404(MainEvent, pk=pk).delete()
    elif lvl == "sub":
        get_object_or_404(SubEvent, pk=pk).delete()
    elif lvl in ("subsub", "sub_sub"):
        get_object_or_404(SubSubEvent, pk=pk).delete()
    else:
        return Response({"error": "Invalid level. Use main | sub | subsub."}, status=400)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@transaction.atomic
def update_event_users(request):
    """
        {
      "eventId": <int>,
      "level": "main" | "sub" | "subsub",
      "roles": {
        "admins":   [{"email":"a@amrita.edu"}, ...],
        "managers": [{"email":"m@amrita.edu"}, ...]
      }
    }
    Replace admins and managers for a given event.
    Ensures: a user cannot be both admin and manager for the same event.
    """
    data = request.data
    event_id = data.get("eventId")
    level = (data.get("level") or "").lower()
    roles = data.get("roles", {})
    admins = {a["email"].strip().lower() for a in roles.get("admins", []) if a.get("email")}
    managers = {m["email"].strip().lower() for m in roles.get("managers", []) if m.get("email")}
    print(admins, managers)
    # check conflicts
    conflicts = admins & managers
    if conflicts:
        return Response(
            {"error": "User cannot be both admin and manager", "conflicts": list(conflicts)},
            status=400,
        )

    # resolve scope
    if level == "main":
        obj = get_object_or_404(MainEvent, pk=event_id)
        mapping_filter = {"main_event": obj}
        admin_role, manager_role = User.Role.EVENTADMIN, User.Role.EVENTMANAGER
    elif level == "sub":
        obj = get_object_or_404(SubEvent, pk=event_id)
        mapping_filter = {"sub_event": obj}
        admin_role, manager_role = User.Role.SUBEVENTADMIN, User.Role.SUBEVENTMANAGER
    else:  # subsub
        obj = get_object_or_404(SubSubEvent, pk=event_id)
        mapping_filter = {"sub_sub_event": obj}
        admin_role, manager_role = None, User.Role.SUBSUBEVENTMANAGER

    # delete all old mappings for this event scope
    EventUserMapping.objects.filter(**mapping_filter).exclude(user_role__in=[User.Role.SUPERADMIN]).delete()

    # recreate
    created = 0
    if admin_role:
        for email in admins:
            try:
                user = User.objects.get(email=email)
                promote_user_if_higher(user, admin_role)
                EventUserMapping.objects.create(user=user, user_role=admin_role, **mapping_filter)
                created += 1
            except User.DoesNotExist:
                continue
    for email in managers:
        try:
            user = User.objects.get(email=email)
            promote_user_if_higher(user, manager_role)
            EventUserMapping.objects.create(user=user, user_role=manager_role, **mapping_filter)
            created += 1
        except User.DoesNotExist:
            continue

    return Response({"ok": True, "created": created}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_events(request):
    mainEvents = MainEvent.objects.all()
    respData = []

    for mainEvent in mainEvents:
        subEventsData = []
        subEvents = SubEvent.objects.filter(parent_event=mainEvent)

        for subEvent in subEvents:
            subSubEventsData = []
            subSubEvents = SubSubEvent.objects.filter(parent_subevent=subEvent)

            for ssEvent in subSubEvents:
                subSubEventsData.append({
                    "id": ssEvent.id,
                    "eventId": ssEvent.event_id,
                    "name": ssEvent.name,
                    "description": ssEvent.description,
                    "rules": ssEvent.rules,
                    "minTeamSize": ssEvent.minTeamSize,
                    "maxTeamSize": ssEvent.maxTeamSize,
                    "minFemaleParticipants": ssEvent.minFemaleParticipants,
                    "isFacultyMentorRequired": ssEvent.isFacultyMentorRequired,
                    "isOpen": getattr(ssEvent, "isOpen", True),  # fallback since not in model yet
                })

            subEventsData.append({
                "id": subEvent.id,
                "eventId": subEvent.event_id,
                "name": subEvent.name,
                "description": subEvent.description,
                "isOpen": getattr(subEvent, "isOpen", True),
                "subSubEvents": subSubEventsData
            })

        respData.append({
            "id": mainEvent.id,
            "eventId": mainEvent.event_id,
            "name": mainEvent.name,
            "description": mainEvent.description,
            "isOpen": getattr(mainEvent, "isOpen", True),
            "subEvents": subEventsData
        })

    return Response(respData, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_data(request):
    """
    Return all events where the current user is mapped, with their role.
    """
    user = request.user
    mappings = EventUserMapping.objects.filter(user=user.id).select_related(
        "main_event", "sub_event", "sub_sub_event"
    )

    resp = []

    for m in mappings:
        if m.main_event:
            resp.append({
                "level": "main",
                "id": m.main_event.id,
                "eventId": m.main_event.event_id,
                "name": m.main_event.name,
                "description": m.main_event.description,
                "isOpen": m.main_event.isOpen,
                "role": m.user_role,
            })
        if m.sub_event:
            resp.append({
                "level": "sub",
                "id": m.sub_event.id,
                "eventId": m.sub_event.event_id,
                "name": m.sub_event.name,
                "description": m.sub_event.description,
                "isOpen": m.sub_event.isOpen,
                "role": m.user_role,
                "parentId": m.sub_event.parent_event.id,
                "parentName": m.sub_event.parent_event.name,
            })
        if m.sub_sub_event:
            resp.append({
                "level": "subsub",
                "id": m.sub_sub_event.id,
                "eventId": m.sub_sub_event.event_id,
                "name": m.sub_sub_event.name,
                "description": m.sub_sub_event.description,
                "isOpen": m.sub_sub_event.isOpen,
                "role": m.user_role,
                "parentId": m.sub_sub_event.parent_event.id,
                "parentName": m.sub_sub_event.parent_event.name,
                "subParentId": m.sub_sub_event.parent_subevent.id,
                "subParentName": m.sub_sub_event.parent_subevent.name,
            })

    return Response(resp, status=status.HTTP_200_OK)

@api_view(["GET"])
def get_event_users(request, level, event_id):
    """
    Return current admins & managers for a given event
    """
    level = level.lower()
    if level == "main":
        obj = get_object_or_404(MainEvent, pk=event_id)
        mapping_filter = {"main_event": obj}
    elif level == "sub":
        obj = get_object_or_404(SubEvent, pk=event_id)
        mapping_filter = {"sub_event": obj}
    else:
        obj = get_object_or_404(SubSubEvent, pk=event_id)
        mapping_filter = {"sub_sub_event": obj}

    mappings = EventUserMapping.objects.filter(**mapping_filter)
    data = {
        "admins": [
            {"email": m.user.email, "name": m.user.get_full_name() or m.user.email.split("@")[0]}
            for m in mappings if "ADMIN" in m.user_role
        ],
        "managers": [
            {"email": m.user.email, "name": m.user.get_full_name() or m.user.email.split("@")[0]}
            for m in mappings if "MANAGER" in m.user_role
        ],
    }
    return Response(data, status=200)
