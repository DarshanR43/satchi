from users.models import User

from .models import Project, TeamMember


def normalize_email(value):
    return (value or "").strip().lower()


def normalize_phone(value):
    return (value or "").strip()


def display_member_name(name, email):
    if name:
        return name.strip()
    if email:
        local_part = email.split("@")[0]
        return " ".join(part.capitalize() for part in local_part.replace(".", " ").replace("_", " ").split())
    return "Unknown"


def _normalize_team_member_record(raw_member):
    if isinstance(raw_member, str):
        email = normalize_email(raw_member)
        if not email:
            return None
        return {"name": "", "email": email, "phone": ""}

    if not isinstance(raw_member, dict):
        return None

    name = (raw_member.get("name") or "").strip()
    email = normalize_email(raw_member.get("email"))
    phone = normalize_phone(raw_member.get("phone"))

    if not any([name, email, phone]):
        return None
    if not email:
        return None

    return {"name": name, "email": email, "phone": phone}


def sync_project_participants(project):
    captain_email = normalize_email(project.captain_email)
    captain_user = User.objects.filter(email__iexact=captain_email).first() if captain_email else None
    captain_user_id = captain_user.id if captain_user else None

    if project.captain_user_id != captain_user_id:
        project.captain_user = captain_user
        project.save(update_fields=["captain_user"])

    TeamMember.objects.filter(project=project).delete()

    members_to_create = []
    for raw_member in project.team_members or []:
        member = _normalize_team_member_record(raw_member)
        if not member:
            continue
        linked_user = User.objects.filter(email__iexact=member["email"]).first()
        members_to_create.append(
            TeamMember(
                name=display_member_name(member["name"], member["email"]),
                email=member["email"],
                phone=member["phone"],
                user=linked_user,
                project=project,
            )
        )

    if members_to_create:
        TeamMember.objects.bulk_create(members_to_create)


def sync_user_project_links_for_user(user):
    email = normalize_email(getattr(user, "email", None))
    if not email:
        return

    user_id = getattr(user, "id", None)
    if not user_id:
        return

    user_model = user.__class__
    linked_user = user if isinstance(user, user_model) else user_model.objects.filter(pk=user_id).first()
    if linked_user is None:
        return

    for project in Project.objects.filter(captain_email__iexact=email).exclude(captain_user=linked_user):
        project.captain_user = linked_user
        project.save(update_fields=["captain_user"])

    TeamMember.objects.filter(email__iexact=email).exclude(user=linked_user).update(user=linked_user)
