from django.urls import path
from .views import submit_project

urlpatterns = [
    path('submit-project/', submit_project),
]
