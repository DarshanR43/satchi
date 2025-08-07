from django.http import HttpResponseForbidden
from functools import wraps
from .models import User, EventUserMapping
from functools import wraps
from django.http import HttpResponseForbidden
from events.models import EventUserMapping

def event_role_required(allowed_roles, event_level='main'):
    """
    Decorator to validate if the user has one of the allowed roles for a specific event.
    event_level: 'main', 'sub', or 'sub_sub'
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return HttpResponseForbidden("Authentication required.")

            user = request.user

            # Extract event ID based on level
            event_id = kwargs.get('event_id')  # Ensure your view has event_id in kwargs
            if not event_id:
                return HttpResponseForbidden("Event ID missing in request.")

            # Query EventUserMapping based on level
            if event_level == 'main':
                role_entry = EventUserMapping.objects.filter(
                    user=user,
                    main_event__id=event_id,
                    user_role__in=allowed_roles
                ).first()
            elif event_level == 'sub':
                role_entry = EventUserMapping.objects.filter(
                    user=user,
                    sub_event__id=event_id,
                    user_role__in=allowed_roles
                ).first()
            elif event_level == 'sub_sub':
                role_entry = EventUserMapping.objects.filter(
                    user=user,
                    sub_sub_event__id=event_id,
                    user_role__in=allowed_roles
                ).first()
            else:
                return HttpResponseForbidden("Invalid event level.")

            if role_entry:
                return view_func(request, *args, **kwargs)

            return HttpResponseForbidden("You are not authorized for this event.")
        return wrapper
    return decorator
