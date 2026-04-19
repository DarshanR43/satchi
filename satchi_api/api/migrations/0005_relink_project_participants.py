# Generated manually to relink existing project participants by email.

from django.db import migrations


def _normalize_email(value):
    return (value or "").strip().lower()


def _normalize_phone(value):
    return (value or "").strip()


def _display_member_name(name, email):
    if name:
        return name.strip()
    if email:
        local_part = email.split("@")[0]
        return " ".join(part.capitalize() for part in local_part.replace(".", " ").replace("_", " ").split())
    return "Unknown"


def relink_project_participants(apps, schema_editor):
    Project = apps.get_model("api", "Project")
    TeamMember = apps.get_model("api", "TeamMember")
    User = apps.get_model("users", "User")

    users_by_email = {}
    for user in User.objects.exclude(email__isnull=True).exclude(email__exact=""):
        users_by_email[user.email.strip().lower()] = user.id

    for project in Project.objects.all():
        captain_email = (project.captain_email or "").strip().lower()
        captain_user_id = users_by_email.get(captain_email)
        if project.captain_user_id != captain_user_id:
            project.captain_user_id = captain_user_id
            project.save(update_fields=["captain_user"])

        existing_member_emails = {
            _normalize_email(email)
            for email in TeamMember.objects.filter(project=project).values_list("email", flat=True)
            if _normalize_email(email)
        }
        for raw_member in project.team_members or []:
            if isinstance(raw_member, dict):
                member_name = (raw_member.get("name") or "").strip()
                member_email = _normalize_email(raw_member.get("email"))
                member_phone = _normalize_phone(raw_member.get("phone"))
            else:
                member_name = ""
                member_email = _normalize_email(raw_member)
                member_phone = ""

            if not member_email or member_email in existing_member_emails:
                continue

            TeamMember.objects.create(
                project=project,
                name=_display_member_name(member_name, member_email),
                email=member_email,
                phone=member_phone,
                user_id=users_by_email.get(member_email),
            )
            existing_member_emails.add(member_email)

    for member in TeamMember.objects.all():
        member_email = (member.email or "").strip().lower()
        linked_user_id = users_by_email.get(member_email)
        if member.user_id != linked_user_id:
            member.user_id = linked_user_id
            member.save(update_fields=["user"])


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0004_project_captain_user_project_created_by_and_more"),
        ("users", "0003_alter_user_role_eventusermapping"),
    ]

    operations = [
        migrations.RunPython(relink_project_participants, migrations.RunPython.noop),
    ]
