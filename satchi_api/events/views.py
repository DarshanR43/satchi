from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import MainEvent, SubEvent, SubSubEvent
from users.models import User, EventUserMapping  # adjust app label if different


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
        return Response({"id": obj.id, "level": "main"}, status=201)

    if etype == "sub":
        main = get_object_or_404(MainEvent, pk=data.get("parentId"))
        obj = SubEvent.objects.create(
            parent_event=main, name=name, description=description
        )
        return Response({"id": obj.id, "level": "sub"}, status=201)

    if etype in ("subsub", "sub_sub"):
        main = get_object_or_404(MainEvent, pk=data.get("parentId"))
        sub = get_object_or_404(SubEvent, pk=data.get("subParentId"), parent_event=main)

        # map frontend fields -> model fields
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
    EventUserMapping.objects.filter(**mapping_filter).delete()

    # recreate
    created = 0
    if admin_role:
        for email in admins:
            try:
                user = User.objects.get(email=email)
                EventUserMapping.objects.create(user=user, user_role=admin_role, **mapping_filter)
                created += 1
            except User.DoesNotExist:
                continue
    for email in managers:
        try:
            user = User.objects.get(email=email)
            EventUserMapping.objects.create(user=user, user_role=manager_role, **mapping_filter)
            created += 1
        except User.DoesNotExist:
            continue

    return Response({"ok": True, "created": created}, status=200)



@api_view(['POST'])
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
