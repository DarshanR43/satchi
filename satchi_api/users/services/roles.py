# users/services/roles.py
from django.db import transaction
from users.models import User

# single source of truth for ranking (higher number = stronger role)
ROLE_RANK = {
    User.Role.PARTICIPANT: 0,
    User.Role.SUBSUBEVENTMANAGER: 10,
    User.Role.SUBEVENTMANAGER: 20,
    User.Role.SUBEVENTADMIN: 30,
    User.Role.EVENTMANAGER: 40,
    User.Role.EVENTADMIN: 50,
    User.Role.SUPERADMIN: 100,
}

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
        # never allow demotion of SUPERADMIN etc. (this function only promotes)
        user.role = candidate_role
        user.save(update_fields=["role"])
        return True
    return False
