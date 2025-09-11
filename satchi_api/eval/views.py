from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from events.models import MainEvent, SubEvent, SubSubEvent
from users.models import User
from api.models import Project, TeamMember
from events.models import MainEvent,SubEvent,SubSubEvent
from eval.models import Evaluation, ConsolidatedScore

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

@api_view(['POST'])
def evaluation_view(request):
    try:
        data = request.data
        project_id = data.get('project_id', None)
        evaluator_id = data.get('evaluator_id', None)
        isDisqualified = data.get('isDisqualified', False)
        remarks = data.get('remarks', "")
        rubric_marks = data.get('rubric_marks', {})  # Expecting a dict of { "creativity": 15, "technical": 20 }

        if not project_id or not evaluator_id:
            return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            evaluator = User.objects.get(id=evaluator_id)
        except User.DoesNotExist:
            return Response({"error": "Evaluator not found."}, status=status.HTTP_404_NOT_FOUND)

        consScore = ConsolidatedScore.objects.get(project=project)
        projEval = Evaluation.objects.filter(project=project)
        numJudges = projEval[0].number_of_judges
        if consScore and consScore.total_evaluations > numJudges:
            return Response({"error": "Maximum number of evaluations reached for this project."}, status=status.HTTP_400_BAD_REQUEST)

        if isDisqualified:
            rubric_marks = {}

        evaluation = Evaluation(
            project=project,
            evaluator=evaluator,
            isDisqualified=isDisqualified,
            remarks=remarks,
            rubric_marks=rubric_marks
        )
        evaluation.clean()  # Validate before saving
        evaluation.save()

        consolidate_scores_view(request, project_id)
    
        return Response({"success": "Evaluation submitted successfully."}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from django.db import transaction
from rest_framework.response import Response
from rest_framework import status

def consolidate_scores_view(request, project_id):
    try:
        with transaction.atomic():
            project = Project.objects.get(id=project_id)
            evaluations = Evaluation.objects.filter(project=project).order_by("id")
            if not evaluations.exists():
                return Response({"error": "No evaluations found for this project."}, status=status.HTTP_404_NOT_FOUND)

            if evaluations.count() > evaluations[0].number_of_judges:
                return Response({"error": "Evaluations exceed the number of judges allowed."}, status=status.HTTP_400_BAD_REQUEST)

            if evaluations.count() == 1:
                consScore = ConsolidatedScore.objects.create(
                    project=project,
                    average_score=evaluations[0].total,
                    highest_score=evaluations[0].total,
                    lowest_score=evaluations[0].total,
                    total_evaluations=1
                )
                consScore.save()
                return Response({"success": "Scores consolidated successfully."}, status=status.HTTP_200_OK)
            else:
                consScore = ConsolidatedScore.objects.get(project=project)
                if consScore.total_evaluations >= evaluations[0].number_of_judges:
                    return Response({"error": "Scores have already been consolidated for the maximum number of judges."}, status=status.HTTP_400_BAD_REQUEST)

                latest_eval = evaluations.last()
                prev_count = consScore.total_evaluations
                new_count = prev_count + 1
                consScore.average_score = (consScore.average_score * prev_count + latest_eval.total) / new_count
                consScore.total_evaluations = new_count

                if latest_eval.total > consScore.highest_score:
                    consScore.highest_score = latest_eval.total
                if latest_eval.total < consScore.lowest_score:
                    consScore.lowest_score = latest_eval.total

                consScore.save()

        return Response({"success": "Scores consolidated successfully."}, status=status.HTTP_200_OK)

    except Project.DoesNotExist:
        return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)