from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from events.models import SubSubEvent
from users.models import User
from .models import Project, TeamMember
from rest_framework.permissions import IsAuthenticated

@api_view(['POST'])
def submit_project(request, event_id):
    try:
        data = request.data
        team_name = data.get('team_name', None)
        project_name = data.get('project_topic', None)
        team_captain = data.get('captain_name', None)
        team_captain_email = data.get('captain_email', None)
        team_captain_phone = data.get('captain_phone', None)
        team_members = data.get('team_members', [])
        faculty_mentor_name = data.get('faculty_mentor_name', None)

        if not event_id or not project_name:
            return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event = SubSubEvent.objects.get(event_id=event_id)
            min_team_size = event.minTeamSize
            max_team_size = event.maxTeamSize
            minFemaleParticipants = event.minFemaleParticipants
            isFacultyMentorRequired = event.isFacultyMentorRequired

            if len(team_members) + 1 < min_team_size:
                return Response({"error": f"Team size is less than the minimum required size of {min_team_size}."}, status=status.HTTP_400_BAD_REQUEST)
            if len(team_members) + 1 > max_team_size:
                return Response({"error": f"Team size exceeds the maximum allowed size of {max_team_size}."}, status=status.HTTP_400_BAD_REQUEST)
            
        except SubSubEvent.DoesNotExist:
            return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

        totalEmails = []
        totalEmails.append(team_captain_email.strip())
        for member in team_members:
            totalEmails.append(member.strip())
        
        if len(totalEmails) != len(set(totalEmails)):
            return Response({"error": "Duplicate email addresses found."}, status=status.HTTP_400_BAD_REQUEST)

        femaleCount = 0
        for mails in totalEmails:
            #if not User.objects.filter(email=mails).exists():
            #    return Response({"error": f"Email {mails} is not registered with Gyan. Please Do create a Account"}, status=status.HTTP_400_BAD_REQUEST)
            if TeamMember.objects.filter(email=mails).exists():
                return Response({"error": f"Email {mails} is already registered in another project."}, status=status.HTTP_400_BAD_REQUEST)
            if Project.objects.filter(captain_email=mails).exists():
                return Response({"error": f"Email {mails} is already registered in another project."}, status=status.HTTP_400_BAD_REQUEST)
        """    
            try:
                user = User.objects.get(email=mails)
                if user.sex == 'female':
                    femaleCount += 1
            except User.DoesNotExist:
                 return Response({"error": f"Email {mails} is not registered with Gyan. Please Do create a Account"}, status=status.HTTP_400_BAD_REQUEST)

        if minFemaleParticipants and femaleCount < minFemaleParticipants:
            return Response({"error": f"At least {minFemaleParticipants} female participants are required."}, status=status.HTTP_400_BAD_REQUEST)
        """
        if isFacultyMentorRequired and not faculty_mentor_name:
            return Response({"error": "Faculty mentor name is required."}, status=status.HTTP_400_BAD_REQUEST)

        project = Project.objects.create(
            event=event,
            team_name=team_name,
            project_topic=project_name,
            captain_name=team_captain,
            captain_email=team_captain_email,
            captain_phone=team_captain_phone,
            team_members=team_members,
            faculty_mentor_name=faculty_mentor_name,
        )
        project.save()

        for mails in totalEmails:
            try:
                user = User.objects.get(email=mails)
                TeamMember.objects.create(
                    name=user.full_name,
                    email=user.email,
                    phone=user.phone,
                    project=project
                )
            except User.DoesNotExist:
                TeamMember.objects.create(
                    name="Unknown",
                    email=mails,
                    phone="",
                    project=project
                )

        return Response({"message": "Project submitted successfully."}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_registrations(request):
    email = (request.user.email or '').strip().lower()
    if not email:
        return Response({"registrations": []}, status=status.HTTP_200_OK)

    projects = (
        Project.objects.filter(
            Q(captain_email__iexact=email) | Q(members__email__iexact=email)
        )
        .select_related(
            'event',
            'event__parent_subevent',
            'event__parent_event',
        )
        .distinct()
    )

    payload = []
    for project in projects:
        subsub_event = project.event
        if not subsub_event:
            continue

        sub_event = getattr(subsub_event, 'parent_subevent', None)
        main_event = getattr(subsub_event, 'parent_event', None)

        role = 'Captain' if project.captain_email.strip().lower() == email else 'Team Member'

        payload.append({
            'projectId': project.id,
            'teamName': project.team_name,
            'projectTopic': project.project_topic,
            'role': role,
            'registeredAt': project.submitted_at.isoformat() if project.submitted_at else None,
            'event': {
                'id': subsub_event.id,
                'eventId': subsub_event.event_id,
                'name': subsub_event.name,
                'description': subsub_event.description,
            },
            'subEvent': {
                'id': sub_event.id if sub_event else None,
                'name': sub_event.name if sub_event else None,
            },
            'mainEvent': {
                'id': main_event.id if main_event else None,
                'name': main_event.name if main_event else None,
            },
        })

    return Response({"registrations": payload}, status=status.HTTP_200_OK)
