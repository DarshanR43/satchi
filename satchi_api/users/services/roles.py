# users/services/roles.py
from django.db import transaction
from users.models import User

# single source of truth for ranking (higher number = stronger role)
ROLE_RANK = {
    User.Role.PARTICIPANT: 0,
    User.Role.COORDINATOR: 5,
    User.Role.SUBSUBEVENTMANAGER: 10,
    User.Role.SUBEVENTMANAGER: 20,
    User.Role.SUBEVENTADMIN: 30,
    User.Role.EVENTMANAGER: 40,
    User.Role.EVENTADMIN: 50,
    User.Role.SUPERADMIN: 100,
}


def sync_role_flags(user: User) -> bool:
    """
    Keep Django's built-in admin flags aligned with the app's global role.
    Only SUPERADMIN gets Django superuser/staff access.
    """
    should_have_admin_access = user.role == User.Role.SUPERADMIN
    update_fields = []

    if user.is_staff != should_have_admin_access:
        user.is_staff = should_have_admin_access
        update_fields.append("is_staff")

    if user.is_superuser != should_have_admin_access:
        user.is_superuser = should_have_admin_access
        update_fields.append("is_superuser")

    if update_fields:
        user.save(update_fields=update_fields)
        return True
    return False


@transaction.atomic
def assign_global_role(user: User, role) -> bool:
    """
    Set a user's global role and keep Django flags in sync.
    Returns True if anything changed.
    """
    update_fields = []

    if user.role != role:
        user.role = role
        update_fields.append("role")

    should_have_admin_access = role == User.Role.SUPERADMIN
    if user.is_staff != should_have_admin_access:
        user.is_staff = should_have_admin_access
        update_fields.append("is_staff")

    if user.is_superuser != should_have_admin_access:
        user.is_superuser = should_have_admin_access
        update_fields.append("is_superuser")

    if update_fields:
        user.save(update_fields=update_fields)
        return True
    return False

def get_role_rank(role) -> int:
    return ROLE_RANK.get(role, -1)

def is_higher_role(candidate, current) -> bool:
    return get_role_rank(candidate) > get_role_rank(current)

@transaction.atomic
def promote_user_if_higher(user: User, candidate_role) -> bool:
    """
    Promotes the user to candidate_role if it outranks the user's current role.
    Returns True if promoted, False otherwise. Never demotes.
    """
    if is_higher_role(candidate_role, user.role):
        return assign_global_role(user, candidate_role)
    return False
