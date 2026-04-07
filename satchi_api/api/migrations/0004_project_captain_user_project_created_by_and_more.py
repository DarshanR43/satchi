# Generated manually for project metadata and member linkage updates.

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


def link_existing_users(apps, schema_editor):
    Project = apps.get_model("api", "Project")
    TeamMember = apps.get_model("api", "TeamMember")
    User = apps.get_model("users", "User")

    users_by_email = {}
    for user in User.objects.exclude(email__isnull=True).exclude(email__exact=""):
        users_by_email[user.email.strip().lower()] = user.id

    for project in Project.objects.all():
        captain_email = (project.captain_email or "").strip().lower()
        captain_user_id = users_by_email.get(captain_email)
        if captain_user_id and project.captain_user_id != captain_user_id:
            project.captain_user_id = captain_user_id
            project.save(update_fields=["captain_user"])

    for member in TeamMember.objects.all():
        member_email = (member.email or "").strip().lower()
        linked_user_id = users_by_email.get(member_email)
        if linked_user_id and member.user_id != linked_user_id:
            member.user_id = linked_user_id
            member.save(update_fields=["user"])


def unlink_existing_users(apps, schema_editor):
    Project = apps.get_model("api", "Project")
    TeamMember = apps.get_model("api", "TeamMember")

    Project.objects.update(captain_user=None)
    TeamMember.objects.update(user=None)


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_alter_user_role_eventusermapping"),
        ("api", "0003_project_event_project_faculty_mentor_name_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="captain_user",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="captain_projects", to="users.user"),
        ),
        migrations.AddField(
            model_name="project",
            name="created_by",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_projects", to="users.user"),
        ),
        migrations.AddField(
            model_name="project",
            name="sdgs",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="project",
            name="trl_level",
            field=models.PositiveSmallIntegerField(blank=True, choices=[(1, "TRL 1"), (2, "TRL 2"), (3, "TRL 3"), (4, "TRL 4"), (5, "TRL 5"), (6, "TRL 6"), (7, "TRL 7"), (8, "TRL 8"), (9, "TRL 9")], null=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(9)]),
        ),
        migrations.AlterField(
            model_name="project",
            name="team_members",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="teammember",
            name="user",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="project_memberships", to="users.user"),
        ),
        migrations.RunPython(link_existing_users, unlink_existing_users),
    ]
