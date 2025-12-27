from django.db import models
from django.utils.text import slugify

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
    project_code = models.CharField(max_length=255, unique=True, blank=True, null=True, editable=False)

    submitted_at = models.DateTimeField(auto_now_add=True)

    def _shorten_name(self, name: str, max_length: int = 12) -> str:
        slug = slugify(name or '')
        if not slug:
            return 'NA'
        condensed = slug.replace('-', '')
        return condensed[:max_length].upper() or 'NA'

    def _generate_project_code(self) -> str:
        if not self.event_id:
            return None

        main_event_name = getattr(self.event.parent_event, 'name', '')
        sub_event_name = getattr(self.event.parent_subevent, 'name', '')
        competition_name = getattr(self.event, 'name', '')

        main_segment = self._shorten_name(main_event_name)
        sub_segment = self._shorten_name(sub_event_name)
        competition_segment = self._shorten_name(competition_name)

        prefix = f"{main_segment}_{sub_segment}_{competition_segment}"
        existing_codes = (
            Project.objects.filter(project_code__startswith=f"{prefix}_")
            .values_list('project_code', flat=True)
        )

        next_number = 1
        if existing_codes:
            existing_numbers = []
            for code in existing_codes:
                suffix = code[len(prefix) + 1:]
                if suffix.isdigit():
                    existing_numbers.append(int(suffix))
            if existing_numbers:
                next_number = max(existing_numbers) + 1

        return f"{prefix}_{next_number:03d}"

    def __str__(self):
        return f"{self.captain_name} - {self.project_topic}"

    def save(self, *args, **kwargs):
        if not self.project_code:
            generated_code = self._generate_project_code()
            if generated_code:
                self.project_code = generated_code
        super().save(*args, **kwargs)

class TeamMember(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    project = models.ForeignKey(Project, related_name='members', on_delete=models.CASCADE)

    def __str__(self):
        return self.name
