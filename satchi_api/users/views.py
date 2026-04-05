from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate,logout
from django.contrib.auth.decorators import login_required
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from .decorators import event_role_required
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import get_object_or_404
User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny]) 
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
            phone = request.data.get('phone', '')
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
        user = User(
            #new fields 
            is_verified=False,
            email_verification_token=uuid.uuid4(),
            email=email,
            username=email,  # Required for AbstractUser
            full_name=full_name,
            phone=phone,
            school=school,
            degree=degree if user_type == 'student' else None,
            course=course if user_type == 'student' else None,
            roll_no=roll_no if user_type == 'student' else None,
            sex=sex.lower() if user_type == 'student' else None,
            current_year=current_year if user_type == 'student' else None,
            position=position if user_type != 'student' else None,
            role=User.Role.PARTICIPANT
        )

        user.set_password(password)
        user.save()
# Send verification email
        verification_link = f"{settings.FRONTEND_URL}/verify-email/{user.email_verification_token}/"
        send_mail(
            "Verify your email",
            f"Click the link to verify your email: {verification_link}",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)

    return Response({"error": "Invalid request method"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
@permission_classes([AllowAny])  # anyone can access login
def login_view(request):
    email = request.data.get("email")
    password = request.data.get("password")
    user = authenticate(username=email, password=password)

    if user:
        # Check if email is verified
        if not user.is_verified:
            return Response({"error": "Email not verified. Please check your inbox."}, status=status.HTTP_403_FORBIDDEN)
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "user": {
                "id": user.phone,
                "email": user.email,
                "role": user.role,
                "full_name": user.full_name,
                "phone": user.phone,
                "school": user.school,
                "degree": user.degree,
                "course": user.course,
                "roll_no": user.roll_no,
                "sex": user.sex,
                "current_year": user.current_year,
                "position": user.position
            }
        })
    return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
def logout_view(request):
    if request.auth:
        request.auth.delete()
    return Response({"success": "Logged out"}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_details(request):
    if not request.user.is_authenticated:
        return Response({"error": "User not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
    else:
        user = request.user
        user_data = {
                "id": user.phone,
                "email": user.email,
                "role": user.role,
                "full_name": user.full_name,
                "phone": user.phone,
                "school": user.school,
                "degree": user.degree,
                "course": user.course,
                "roll_no": user.roll_no,
                "sex": user.sex,
                "current_year": user.current_year,
                "position": user.position
        }
        return Response({"user": user_data}, status=status.HTTP_200_OK)
@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request, token):
    user = get_object_or_404(User, email_verification_token=token)
    if user.is_verified:
        return Response({"message": "Email already verified."})
    user.is_verified = True
    user.email_verification_token = None
    user.save()
    return Response({"message": "Email verified successfully."})