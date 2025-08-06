from django.contrib.auth.models import AbstractUser
from django.db import models
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

    # Additional fields
    full_name = models.CharField(max_length=100, default='')
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    roll_no = models.CharField(max_length=20, blank=True, null=True)
    school = models.CharField(max_length=100, blank=True, null=True)
    degree = models.CharField(max_length=100, blank=True, null=True)
    course = models.CharField(max_length=100, blank=True, null=True)
    sex = models.CharField(max_length=10, blank=True, null=True)
    current_year = models.CharField(max_length=10, blank=True, null=True)

    # Faculty-specific fields
    position = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

