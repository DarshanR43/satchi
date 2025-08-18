from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate,logout
from django.contrib.auth.decorators import login_required
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from .decorators import event_role_required

User = get_user_model()

@api_view(['POST'])
def signup_view(request):
    if request.method == 'POST':
        print("Received data:", request.data)
        data = request.data
        email = data.get('email')
        password = data.get('password')
        full_name = request.data.get('fullName')
        user_type = request.data.get('userType', 'PARTICIPANT')

        if user_type != 'student':
            position = request.data.get('position', '')
            phone = None
            roll_no = None
            school = request.data.get('school', '')
            degree = None
            course = None
            sex = None
            current_year = None
        else:
            position = None
            phone = request.data.get('phone', '')
            roll_no = request.data.get('rollNo', '')
            school = request.data.get('school', '')
            degree = request.data.get('degree', '')
            course = request.data.get('course', '')
            sex = request.data.get('sex', '')
            current_year = request.data.get('currentYear', '')

        # All users default to PARTICIPANT role
        print("Received data:", request.data)
        user = User(
            email=email,
            username=email,  # Required for AbstractUser
            full_name=full_name,
            phone=phone,
            school=school,
            degree=degree if user_type == 'student' else None,
            course=course if user_type == 'student' else None,
            roll_no=roll_no if user_type == 'student' else None,
            sex=sex if user_type == 'student' else None,
            current_year=current_year if user_type == 'student' else None,
            position=position if user_type != 'student' else None,
            role=User.Role.PARTICIPANT
        )

        user.set_password(password)
        user.save()

        return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)

    return Response({"error": "Invalid request method"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
def login_view(request):
    email = request.data.get("email")
    password = request.data.get("password")
    user = authenticate(username=email, password=password)

    if user:
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "user": {
                "id": user.phone,
                "email": user.email,
                "role": user.role,
            }
        })
    return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
def logout_view(request):
    if request.auth:
        request.auth.delete()
    return Response({"success": "Logged out"}, status=status.HTTP_200_OK)


def get_user_details(request):
    if not request.user.is_authenticated:
        return Response({"error": "User not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
    else:
        user = request.user
        user_data = {
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "role": user.role,
        }
        return Response({"user": user_data}, status=status.HTTP_200_OK)