from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from users.decorators import event_role_required
from django.contrib.auth import authenticate,logout
from django.contrib.auth.decorators import login_required
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model

