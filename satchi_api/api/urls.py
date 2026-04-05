from django.urls import path

from backend.views import health_check

from . import views

urlpatterns = [
    path('health/', health_check),
    path('submit-project/<str:event_id>/', views.submit_project),
    path('my-registrations/', views.user_registrations),
    path('statistics/<str:event_id>/', views.get_event_statistics),
]
