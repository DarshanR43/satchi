from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        PARTICIPANT = "PARTICIPANT", "Participant"
        MANAGER = "MANAGER", "Manager"
        COORDINATOR = "COORDINATOR", "Coordinator"
        ADMIN = "ADMIN", "Admin"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.PARTICIPANT,
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
