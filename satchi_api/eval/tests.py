from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from events.models import MainEvent, SubEvent, SubSubEvent
from api.models import Project
from eval.models import (
    SubSubEventJudge,
    Rubric,
    Evaluation,
    EvaluationJudgeMark,
    EvaluationJudgeRubricMark,
)

User = get_user_model()

class RubricEvaluationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create user & authenticate
        self.user = User.objects.create_user(username="testadmin", password="password123")
        self.client.force_authenticate(user=self.user)
        
        # Create Events
        self.main_event = MainEvent.objects.create(name="Main Event")
        self.sub_event = SubEvent.objects.create(
            parent_event=self.main_event,
            name="Sub Event"
        )
        self.subsub_event = SubSubEvent.objects.create(
            parent_event=self.main_event,
            parent_subevent=self.sub_event,
            name="Sub Sub Event"
        )
        
        # Create Project
        self.project = Project.objects.create(
            event=self.subsub_event,
            team_name="Team Alpha",
            captain_name="Captain Alpha",
            captain_email="alpha@gmail.com",
            captain_phone="1234567890"
        )

    def test_link_judges_with_rubrics(self):
        """Test assigning judges with rubric criteria."""
        url = "/eval/subsubevents/judges/link/"
        payload = {
            "subsubevent_id": self.subsub_event.id,
            "names": ["Judge Alice", "Judge Bob"],
            "rubrics": [
                {"name": "Innovation", "max_mark": 10},
                {"name": "Presentation", "max_mark": 15}
            ],
            "replace": True
        }
        
        response = self.client.post(url, payload, format="json", secure=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check judges were linked
        judges = SubSubEventJudge.objects.filter(subsubevent=self.subsub_event)
        self.assertEqual(judges.count(), 2)
        
        # Check rubrics were created
        rubrics = Rubric.objects.filter(subsubevent=self.subsub_event)
        self.assertEqual(rubrics.count(), 2)
        self.assertTrue(rubrics.filter(name="Innovation", max_mark=10).exists())
        self.assertTrue(rubrics.filter(name="Presentation", max_mark=15).exists())

    def test_link_judges_and_get_them(self):
        """Test that get judges endpoint lists the created rubrics and judges."""
        # Setup judges and rubrics
        SubSubEventJudge.objects.create(subsubevent=self.subsub_event, name="Judge Alice")
        Rubric.objects.create(subsubevent=self.subsub_event, name="Design", max_mark=20)
        
        url = f"/eval/subsubevents/{self.subsub_event.id}/judges/"
        response = self.client.get(url, secure=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertIn("judges", data)
        self.assertIn("rubrics", data)
        self.assertEqual(len(data["judges"]), 1)
        self.assertEqual(data["judges"][0]["name"], "Judge Alice")
        self.assertEqual(len(data["rubrics"]), 1)
        self.assertEqual(data["rubrics"][0]["name"], "Design")
        self.assertEqual(data["rubrics"][0]["max_mark"], 20.0)

    def test_submit_evaluation_with_rubrics(self):
        """Test submitting evaluation marks using rubrics is processed and summed up correctly."""
        # Setup rubrics and judges
        Rubric.objects.create(subsubevent=self.subsub_event, name="Innovation", max_mark=10.0)
        Rubric.objects.create(subsubevent=self.subsub_event, name="Clarity", max_mark=5.0)
        SubSubEventJudge.objects.create(subsubevent=self.subsub_event, name="Judge Alice")
        
        url = "/eval/evaluations/submit/"
        payload = {
            "project_id": self.project.id,
            "subsubevent_id": self.subsub_event.id,
            "is_disqualified": False,
            "remarks": "Great job!",
            "marks": [
                {
                    "judge_name": "Judge Alice",
                    "rubric_marks": [
                        {"rubric_name": "Innovation", "mark": "8.5"},
                        {"rubric_name": "Clarity", "mark": "4.0"}
                    ],
                    "comments": "Very good overall."
                }
            ]
        }
        
        response = self.client.post(url, payload, format="json", secure=True)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify the saved Evaluation
        evaluation = Evaluation.objects.get(project=self.project, subsubevent=self.subsub_event)
        self.assertFalse(evaluation.is_disqualified)
        self.assertEqual(evaluation.remarks, "Great job!")
        
        # Sum of 8.5 + 4.0 = 12.5. Since 1 judge, final score should be 12.5
        self.assertEqual(float(evaluation.total), 12.5)
        self.assertEqual(float(evaluation.final_score), 12.5)
        self.assertEqual(evaluation.number_of_judges, 1)
        
        # Verify EvaluationJudgeMark
        judge_mark = EvaluationJudgeMark.objects.get(evaluation=evaluation, judge_name="Judge Alice")
        self.assertEqual(float(judge_mark.mark), 12.5)
        
        # Verify EvaluationJudgeRubricMark
        rubric_marks = EvaluationJudgeRubricMark.objects.filter(judge_mark=judge_mark)
        self.assertEqual(rubric_marks.count(), 2)
        
        innovation_mark = rubric_marks.get(rubric__name="Innovation")
        self.assertEqual(float(innovation_mark.mark), 8.5)
        
        clarity_mark = rubric_marks.get(rubric__name="Clarity")
        self.assertEqual(float(clarity_mark.mark), 4.0)

    def test_submit_evaluation_rubric_validation(self):
        """Test that rubric marks exceeding max mark are rejected."""
        Rubric.objects.create(subsubevent=self.subsub_event, name="Innovation", max_mark=10.0)
        SubSubEventJudge.objects.create(subsubevent=self.subsub_event, name="Judge Alice")
        
        url = "/eval/evaluations/submit/"
        # Exceeds max mark (12 > 10)
        payload = {
            "project_id": self.project.id,
            "subsubevent_id": self.subsub_event.id,
            "is_disqualified": False,
            "marks": [
                {
                    "judge_name": "Judge Alice",
                    "rubric_marks": [
                        {"rubric_name": "Innovation", "mark": "12.0"}
                    ]
                }
            ]
        }
        
        response = self.client.post(url, payload, format="json", secure=True)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("exceeds the maximum permitted mark", response.json()["error"])
