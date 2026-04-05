from django.urls import path
from . import views
from .views import signup_view, verify_email
urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('profile/', views.get_user_details, name='profile'),
    path('logout/', views.logout_view, name='logout'),
    path('signup/', signup_view),
    path('verify-email/<uuid:token>/', verify_email)
]
