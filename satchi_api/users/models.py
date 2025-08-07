from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db import models
from events.models import MainEvent, SubEvent, SubSubEvent

class User(AbstractUser):
    class Role(models.TextChoices):
        PARTICIPANT = "PARTICIPANT", "Participant"
        SUPERADMIN = "SUPERADMIN", "Super Admin"
        EVENTADMIN = "EVENTADMIN", "Event Admin"
        SUBEVENTADMIN = "SUBEVENTADMIN", "Sub Event Admin"
        EVENTMANAGER = "EVENTMANAGER", "Event Manager"
        SUBEVENTMANAGER = "SUBEVENTMANAGER", "Sub Event Manager"
        SUBSUBEVENTMANAGER = "SUBSUBEVENTMANAGER", "Sub Sub Event Manager"
        COORDINATOR = "COORDINATOR", "Coordinator"

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

class EventUserMapping(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    main_event = models.ForeignKey(MainEvent, on_delete=models.CASCADE, related_name='event_users', null=True, blank=True)
    sub_event = models.ForeignKey(SubEvent, on_delete=models.CASCADE, related_name='event_users', null=True, blank=True)
    sub_sub_event = models.ForeignKey(SubSubEvent, on_delete=models.CASCADE, related_name='event_users', null=True, blank=True)
    user_role = models.CharField(max_length=20, choices=User.Role.choices, default=User.Role.PARTICIPANT)

    def __str__(self):
        return f"{self.user.username} - {self.main_event.name if self.main_event else ''} {self.sub_event.name if self.sub_event else ''} {self.sub_sub_event.name if self.sub_sub_event else ''}"
    