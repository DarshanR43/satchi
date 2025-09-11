from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError
from users.models import User
from events.models import SubSubEvent
from api.models import Project

class RubricDefinition(models.Model):
    code = models.CharField(max_length=100, unique=True)   # e.g. "creativity"
    name = models.CharField(max_length=255)                # e.g. "Creativity & Originality"
    max_mark = models.PositiveIntegerField(default=10)

    def __str__(self):
        return self.name


class Evaluation(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="evaluations")
    evaluator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    isDisqualified = models.BooleanField(default=False)
    remarks = models.TextField(blank=True, null=True)
    rubric_marks = models.JSONField(default=dict, blank=True)
    number_of_judges = models.PositiveIntegerField(default=2)
    # example payload: { "creativity": 15, "technical": 20 }

    total = models.PositiveIntegerField(default=0)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Evaluation of {self.team} by {self.evaluator or 'Unknown'}"

    def clean(self):
        # optional: check scores don’t exceed rubric max
        for code, score in (self.rubric_marks or {}).items():
            try:
                rubric = RubricDefinition.objects.get(code=code)
            except RubricDefinition.DoesNotExist:
                raise ValidationError(f"Rubric {code} not defined")
            if score > rubric.max_mark:
                raise ValidationError(f"{code} score {score} exceeds max {rubric.max_mark}")

    def save(self, *args, **kwargs):
        # auto-calc total
        self.total = sum(self.rubric_marks.values()) if self.rubric_marks else 0
        super().save(*args, **kwargs)

class ConsolidatedScore(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="consolidated_scores")
    average_score = models.FloatField(default=0.0)
    highest_score = models.FloatField(default=0.0)
    lowest_score = models.FloatField(default=0.0)
    total_evaluations = models.PositiveIntegerField(default=0)