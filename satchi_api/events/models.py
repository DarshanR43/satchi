from django.db import models
import datetime

class MainEvent(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    event_id = models.CharField(max_length=100, unique=True, blank=True, editable=False)
    isOpen = models.BooleanField(default=True,null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.event_id:
            now = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            self.event_id = f"EVT{now}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class SubEvent(models.Model):
    parent_event = models.ForeignKey(MainEvent, related_name='subevents', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    event_id = models.CharField(max_length=100, unique=True, blank=True, editable=False)
    isOpen = models.BooleanField(default=True,null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.event_id:
            now = datetime.datetime.now().strftime("%Y%m%d%H%M%S%f")
            self.event_id = f"EVT_S{now}"
        super().save(*args, **kwargs)


    def __str__(self):
        return f"{self.name} ({self.parent_event.name})"


class SubSubEvent(models.Model):
    parent_event = models.ForeignKey(MainEvent, related_name='subsubevents', on_delete=models.CASCADE)
    parent_subevent = models.ForeignKey(SubEvent, related_name='subsubevents', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    isOpen = models.BooleanField(default=True,null=True, blank=True)

    rules = models.TextField(blank=True, null=True)
    minTeamSize = models.PositiveIntegerField(default=1)
    maxTeamSize = models.PositiveIntegerField(default=1)
    minFemaleParticipants = models.PositiveIntegerField(default=0)
    isFacultyMentorRequired = models.BooleanField(default=False)
    
    event_id = models.CharField(max_length=100, unique=True, blank=True, editable=False)
    def save(self, *args, **kwargs):
        if not self.event_id:
            now = datetime.datetime.now().strftime("%Y%m%d%H%M%S%f")
            self.event_id = f"EVT_SS{now}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.parent_subevent.name})"

