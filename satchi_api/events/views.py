from rest_framework.response import Response
from rest_framework import status
from .models import MainEvent, SubEvent, SubSubEvent


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
