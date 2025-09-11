from django.urls import path
from .views import *

urlpatterns = [
    path('submit-evaluation/<int:project_id>/', evaluation_view, name='submit_evaluation'),
    path('get_main_events/', get_main_events, name='get_main_events'),
    path('get_subevents/<int:main_event_id>/', get_subevents, name='get_subevents'),
    path('get_subsubevents/<int:sub_event_id>/', get_subsubevents, name='get_subsubevents'),
    path('get_projects/<int:event_id>/', getProjectsByEvent, name='get_projects_by_event'),
]