from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from events.models import SubSubEvent
from users.models import User

class Project(models.Model):
    TRL_LEVELS = [(level, f"TRL {level}") for level in range(1, 10)]
    PROJECT_CATEGORIES = [
        ("HARDWARE", "Hardware"),
        ("SOFTWARE", "Software"),
    ]

    event = models.ForeignKey(SubSubEvent, on_delete=models.CASCADE,default=1)
    created_by = models.ForeignKey(User, related_name='created_projects', on_delete=models.SET_NULL, null=True, blank=True)
    captain_user = models.ForeignKey(User, related_name='captain_projects', on_delete=models.SET_NULL, null=True, blank=True)
    team_name = models.CharField(max_length=100)
    project_topic = models.TextField()
    project_category = models.CharField(max_length=20, choices=PROJECT_CATEGORIES, blank=True, null=True)
    trl_level = models.PositiveSmallIntegerField(
        choices=TRL_LEVELS,
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(9)],
    )
    sdgs = models.JSONField(default=list, blank=True)
    captain_name = models.CharField(max_length=100)
    captain_phone = models.CharField(max_length=20)
    captain_email = models.EmailField()
    team_members = models.JSONField(default=list, blank=True)  # Snapshot of non-captain members
    faculty_mentor_name = models.CharField(max_length=100, blank=True, null=True)

    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.captain_name} - {self.project_topic}"
    
class TeamMember(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    user = models.ForeignKey(User, related_name='project_memberships', on_delete=models.SET_NULL, null=True, blank=True)
    project = models.ForeignKey(Project, related_name='members', on_delete=models.CASCADE)

    def __str__(self):
        return self.name
