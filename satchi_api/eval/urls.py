from django.urls import path
from .views import *

urlpatterns = [
    path('get_main_events/', get_main_events, name='get_main_events'),
    path('get_subevents/<int:main_event_id>/', get_subevents, name='get_subevents'),
    path('get_subsubevents/<int:sub_event_id>/', get_subsubevents, name='get_subsubevents'),
    path('get_projects/<int:event_id>/', getProjectsByEvent, name='get_projects_by_event'),
    path("subsubevents/judges/link/", link_judges_to_subsubevent, name="link-judges"),
    path("subsubevents/<int:subsubevent_id>/judges/", list_judges_for_subsubevent, name="list-judges"),
    path("evaluations/submit/", submit_evaluation_marks, name="submit-evaluation"),
    
]