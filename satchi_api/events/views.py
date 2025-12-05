from collections import defaultdict

from django.db import transaction
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import MainEvent, SubEvent, SubSubEvent
from users.models import EventUserMapping, User  # adjust app label if different
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

    # delete all old mappings for this event scope except for superadmins
    EventUserMapping.objects.filter(**mapping_filter).exclude(user_role__in=[User.Role.SUPERADMIN]).delete()

    # keep track of superadmins so we do not create duplicate mappings for them
    existing_superadmins = set(
        EventUserMapping.objects.filter(**mapping_filter, user_role=User.Role.SUPERADMIN)
        .values_list("user_id", flat=True)
    )

    # recreate
    created = 0
    if admin_role:
        for email in admins:
            try:
                user = User.objects.get(email=email)
                if user.id in existing_superadmins:
                    continue
                promote_user_if_higher(user, admin_role)
                _, created_flag = EventUserMapping.objects.get_or_create(
                    user=user,
                    user_role=admin_role,
                    **mapping_filter,
                )
                if created_flag:
                    created += 1
            except User.DoesNotExist:
                continue
    for email in managers:
        try:
            user = User.objects.get(email=email)
            if user.id in existing_superadmins:
                continue
            promote_user_if_higher(user, manager_role)
            _, created_flag = EventUserMapping.objects.get_or_create(
                user=user,
                user_role=manager_role,
                **mapping_filter,
            )
            if created_flag:
                created += 1
        except User.DoesNotExist:
            continue

    return Response({"ok": True, "created": created}, status=200)


@api_view(['GET'])
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

ROLE_PRIORITY = {
    User.Role.SUPERADMIN: 0,
    User.Role.EVENTADMIN: 1,
    User.Role.EVENTMANAGER: 2,
    User.Role.SUBEVENTADMIN: 3,
    User.Role.SUBEVENTMANAGER: 4,
    User.Role.SUBSUBEVENTMANAGER: 5,
    User.Role.COORDINATOR: 6,
    User.Role.PARTICIPANT: 7,
}


def _pick_highest_role(roles, fallback=None):
    if not roles and fallback:
        return fallback
    if not roles:
        return None
    return sorted(roles, key=lambda role: ROLE_PRIORITY.get(role, 99))[0]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_data(request):
    """Return a hierarchical listing of events the user can manage, preserving level metadata."""

    user = request.user
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

    main_roles = defaultdict(set)
    sub_roles = defaultdict(set)
    subsub_roles = defaultdict(set)

    accessible_main_ids = set()
    accessible_sub_ids = set()

    full_main_ids = set()
    full_sub_ids = set()

    subs_by_main = defaultdict(set)
    subsubs_by_sub = defaultdict(set)

    MAIN_TREE_ROLES = {User.Role.SUPERADMIN, User.Role.EVENTADMIN, User.Role.EVENTMANAGER}
    SUB_TREE_ROLES = {
        User.Role.SUPERADMIN,
        User.Role.EVENTADMIN,
        User.Role.EVENTMANAGER,
        User.Role.SUBEVENTADMIN,
        User.Role.SUBEVENTMANAGER,
    }

    for mapping in mappings:
        if mapping.main_event_id:
            main_id = mapping.main_event_id
            accessible_main_ids.add(main_id)
            main_roles[main_id].add(mapping.user_role)
            if mapping.user_role in MAIN_TREE_ROLES:
                full_main_ids.add(main_id)

        if mapping.sub_event_id:
            sub = mapping.sub_event
            sub_id = sub.id
            accessible_sub_ids.add(sub_id)
            sub_roles[sub_id].add(mapping.user_role)
            parent_main_id = sub.parent_event_id
            accessible_main_ids.add(parent_main_id)
            subs_by_main[parent_main_id].add(sub_id)
            if mapping.user_role in SUB_TREE_ROLES:
                full_sub_ids.add(sub_id)
            if mapping.user_role in MAIN_TREE_ROLES:
                full_main_ids.add(parent_main_id)

        if mapping.sub_sub_event_id:
            subsub = mapping.sub_sub_event
            subsub_id = subsub.id
            subsub_roles[subsub_id].add(mapping.user_role)
            parent_sub_id = subsub.parent_subevent_id
            parent_main_id = subsub.parent_event_id
            accessible_sub_ids.add(parent_sub_id)
            accessible_main_ids.add(parent_main_id)
            subs_by_main[parent_main_id].add(parent_sub_id)
            subsubs_by_sub[parent_sub_id].add(subsub_id)

    # Superusers can see the entire tree even without explicit mappings.
    if user.is_superuser:
        all_main_ids = set(MainEvent.objects.values_list("id", flat=True))
        accessible_main_ids |= all_main_ids
        full_main_ids |= all_main_ids
        for mid in all_main_ids:
            main_roles[mid].add(User.Role.SUPERADMIN)

    target_main_ids = accessible_main_ids | full_main_ids
    if not target_main_ids:
        return Response([], status=status.HTTP_200_OK)

    sub_prefetch = Prefetch(
        "subevents",
        queryset=SubEvent.objects.order_by("id").prefetch_related(
            Prefetch("subsubevents", queryset=SubSubEvent.objects.order_by("id"))
        ),
    )

    main_queryset = (
        MainEvent.objects.filter(id__in=target_main_ids)
        .order_by("id")
        .prefetch_related(sub_prefetch)
    )

    response_payload = []

    for main in main_queryset:
        relevant_sub_ids = subs_by_main.get(main.id, set())
        include_all_subs = main.id in full_main_ids or user.is_superuser
        sub_events = (
            list(main.subevents.all())
            if include_all_subs
            else [sub for sub in main.subevents.all() if sub.id in relevant_sub_ids]
        )

        main_role_candidates = set(main_roles.get(main.id, set()))
        for sub_id in relevant_sub_ids:
            main_role_candidates |= sub_roles.get(sub_id, set())
            for subsub_id in subsubs_by_sub.get(sub_id, set()):
                main_role_candidates |= subsub_roles.get(subsub_id, set())
        if include_all_subs and not main_role_candidates:
            main_role_candidates.add(User.Role.SUPERADMIN if user.is_superuser else User.Role.EVENTADMIN)

        main_role = _pick_highest_role(main_role_candidates)

        response_payload.append(
            {
                "level": "main",
                "id": main.id,
                "eventId": main.event_id,
                "name": main.name,
                "description": main.description,
                "isOpen": main.isOpen,
                "role": main_role,
            }
        )

        for sub_event in sub_events:
            include_all_subsubs = include_all_subs or sub_event.id in full_sub_ids
            relevant_subsub_ids = subsubs_by_sub.get(sub_event.id, set())
            subsub_events = (
                list(sub_event.subsubevents.all())
                if include_all_subsubs
                else [
                    ss_event
                    for ss_event in sub_event.subsubevents.all()
                    if ss_event.id in relevant_subsub_ids
                ]
            )

            sub_role_candidates = set(sub_roles.get(sub_event.id, set()))
            if not include_all_subsubs:
                for subsub_id in relevant_subsub_ids:
                    sub_role_candidates |= subsub_roles.get(subsub_id, set())
            if include_all_subsubs and not sub_role_candidates and main_role:
                sub_role_candidates.add(main_role)

            sub_role = _pick_highest_role(sub_role_candidates, fallback=main_role)

            response_payload.append(
                {
                    "level": "sub",
                    "id": sub_event.id,
                    "eventId": sub_event.event_id,
                    "name": sub_event.name,
                    "description": sub_event.description,
                    "isOpen": sub_event.isOpen,
                    "role": sub_role,
                    "parentId": main.id,
                    "parentName": main.name,
                }
            )

            for subsub_event in subsub_events:
                subsub_role_candidates = set(subsub_roles.get(subsub_event.id, set()))
                if not subsub_role_candidates:
                    fallback_role = sub_role or main_role
                else:
                    fallback_role = None
                subsub_role = _pick_highest_role(subsub_role_candidates, fallback=fallback_role)

                response_payload.append(
                    {
                        "level": "subsub",
                        "id": subsub_event.id,
                        "eventId": subsub_event.event_id,
                        "name": subsub_event.name,
                        "description": subsub_event.description,
                        "isOpen": subsub_event.isOpen,
                        "role": subsub_role,
                        "parentId": main.id,
                        "parentName": main.name,
                        "subParentId": sub_event.id,
                        "subParentName": sub_event.name,
                    }
                )

    return Response(response_payload, status=status.HTTP_200_OK)

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

    mappings = (
        EventUserMapping.objects.filter(**mapping_filter)
        .select_related("user")
        .order_by("user__email")
    )

    user_best_role = {}
    for mapping in mappings:
        role_priority = ROLE_PRIORITY.get(mapping.user_role, 99)
        cached = user_best_role.get(mapping.user_id)
        if cached is None or role_priority < cached["priority"]:
            user_best_role[mapping.user_id] = {
                "user": mapping.user,
                "role": mapping.user_role,
                "priority": role_priority,
            }

    admins = []
    managers = []
    for entry in user_best_role.values():
        user = entry["user"]
        display_name = user.get_full_name() or user.email.split("@")[0]
        record = {"email": user.email, "name": display_name}
        role = entry["role"] or ""
        if "ADMIN" in role:
            admins.append(record)
        elif "MANAGER" in role:
            managers.append(record)

    data = {"admins": admins, "managers": managers}
    return Response(data, status=200)

@api_view(["GET"])
def getSubSubEventDetails(request, event_id):
    """
    Return details for a specific event
    """
    obj = get_object_or_404(SubSubEvent, pk=event_id)
    data = {
        "id": obj.id,
        "eventId": obj.event_id,
        "name": obj.name,
        "description": obj.description,
        "isOpen": obj.isOpen,
        "rules": obj.rules,
        "minTeamSize": obj.minTeamSize,
        "maxTeamSize": obj.maxTeamSize,
        "minFemaleParticipants": obj.minFemaleParticipants,
        "isFacultyMentorRequired": obj.isFacultyMentorRequired,
    }

    return Response(data, status=200)

@api_view(["POST"])
@transaction.atomic
def openStateEvent(request,level,eventid):
    if level == "main":
        obj = get_object_or_404(MainEvent, pk=eventid)
    elif level == "sub":
        obj = get_object_or_404(SubEvent, pk=eventid)
    else:
        obj = get_object_or_404(SubSubEvent, pk=eventid)

    if obj.isOpen == True:
        obj.isOpen = False
        obj.save()
    else:
        obj.isOpen = True
        obj.save()

    return Response({"status": "success"}, status=200)



