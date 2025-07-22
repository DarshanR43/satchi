from django.db import models

class Project(models.Model):
    captain_name = models.CharField(max_length=100)
    team_members = models.JSONField()  # Stores list of team member names
    captain_phone = models.CharField(max_length=20)
    captain_email = models.EmailField()
    project_topic = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.captain_name} - {self.project_topic}"
