from django.urls import path
from .views import ProjectSubmissionView

urlpatterns = [
    path('submit-project/', ProjectSubmissionView.as_view(), name='submit-project'),
]
