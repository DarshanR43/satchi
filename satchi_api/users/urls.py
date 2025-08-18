from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('profile/', views.get_user_details, name='profile'),
    path('logout/', views.logout_view, name='logout')
]
