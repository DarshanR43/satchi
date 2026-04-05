from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('profile/', views.get_user_details, name='profile'),
    path('logout/', views.logout_view, name='logout'),
    path('admin/users/', views.manage_users, name='manage_users'),
    path('admin/users/<int:user_id>/', views.update_managed_user, name='update_managed_user'),
]
