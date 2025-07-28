from django.http import HttpResponseForbidden
from functools import wraps

def role_required(allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return HttpResponseForbidden("Authentication required.")
            if request.user.role in allowed_roles:
                return view_func(request, *args, **kwargs)
            return HttpResponseForbidden("You are not authorized to view this page.")
        return wrapper
    return decorator

# users/decorators.py

def admin_required(view_func):
    return role_required(['ADMIN'])(view_func)

def manager_required(view_func):
    return role_required(['MANAGER'])(view_func)

def coordinator_required(view_func):
    return role_required(['COORDINATOR'])(view_func)

def participant_required(view_func):
    return role_required(['PARTICIPANT'])(view_func)
