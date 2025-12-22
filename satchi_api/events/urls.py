from django.urls import path
from . import views

urlpatterns = [
    path('getEvents/', views.get_events, name='get_events'),
    path('create_event/', views.create_event, name='create_event'),
    path('update_event_users/', views.update_event_users, name='update_event_users'),
    path('update_event/<str:level>/<int:pk>/', views.update_event, name='update_event'),
    path("get_event_users/<str:level>/<int:event_id>/", views.get_event_users, name="get_event_users"),
    path('delete_event/<str:level>/<int:pk>/', views.delete_event, name='delete_event'),
    path('admin-data/', views.admin_data, name='admin_data'),
    path('details/<int:event_id>/', views.getSubSubEventDetails, name='get_event_details'),
    path('toggle_status/<str:level>/<int:eventid>/', views.openStateEvent, name='toggle_event_status'),
]
