from django.urls import path
from .views import submit_project, user_registrations

urlpatterns = [
    path('submit-project/<str:event_id>/', submit_project),
    path('my-registrations/', user_registrations),
]
