from django.urls import path
from .views import submit_project

urlpatterns = [
    path('submit-project/<str:event_id>/', submit_project),
]
