from django.db import models
from events.models import SubSubEvent
from users.models import User

class Project(models.Model):
    event = models.ForeignKey(SubSubEvent, on_delete=models.CASCADE,default=1)
    team_name = models.CharField(max_length=100)
    project_topic = models.TextField()
    captain_name = models.CharField(max_length=100)
    captain_phone = models.CharField(max_length=20)
    captain_email = models.EmailField()
    team_members = models.JSONField()  # Stores list of team member names
    faculty_mentor_name = models.CharField(max_length=100, blank=True, null=True)

    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.captain_name} - {self.project_topic}"
    
class TeamMember(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    project = models.ForeignKey(Project, related_name='members', on_delete=models.CASCADE)

    def __str__(self):
        return self.name
