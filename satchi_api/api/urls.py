from django.urls import path

from backend.views import health_check

from . import views

urlpatterns = [
    path('health/', health_check),
    path('submit-project/<str:event_id>/', views.submit_project),
    path('event-registrations/<int:event_pk>/', views.event_registrations),
    path('event-registrations/<int:event_pk>/<int:project_id>/', views.manage_event_registration),
    path('my-registrations/', views.user_registrations),
    path('statistics/<str:event_id>/', views.get_event_statistics),
]
