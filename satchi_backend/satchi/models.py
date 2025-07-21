# myproject/submission_app/models.py
from django.db import models

class ProjectSubmission(models.Model):
    """
    Django model to store project submission details.
    """
    captain_name = models.CharField(max_length=255, help_text="Name of the team captain.")
    team_members = models.JSONField(default=list, help_text="List of team members' names.")
    captain_phone = models.CharField(max_length=20, help_text="Phone number of the team captain.")
    captain_email = models.EmailField(help_text="Email address of the team captain.")
    project_topic = models.TextField(help_text="Topic or description of the project.")
    submitted_at = models.DateTimeField(auto_now_add=True, help_text="Timestamp of submission.")

    class Meta:
        verbose_name = "Project Submission"
        verbose_name_plural = "Project Submissions"
        ordering = ['-submitted_at']

    def _str_(self):
        return f"{self.captain_name}'s Project: {self.project_topic[:50]}..."
