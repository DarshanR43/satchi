from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate,logout
from django.contrib.auth.decorators import login_required
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from api.services import sync_user_project_links_for_user
from .decorators import event_role_required
from .services.roles import assign_global_role, sync_role_flags

User = get_user_model()


def _serialize_user(user):
    return {
        "id": user.id,
        "username": user.username,
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
        "position": user.position,
        "is_superuser": user.is_superuser,
        "is_staff": user.is_staff,
    }


def _is_superadmin(user):
    return bool(user and user.is_authenticated and (user.role == User.Role.SUPERADMIN or user.is_superuser))


def _count_other_superadmins(user_id):
    return User.objects.filter(role=User.Role.SUPERADMIN).exclude(pk=user_id).count()

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
        sync_user_project_links_for_user(user)

        return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)

    return Response({"error": "Invalid request method"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
@permission_classes([AllowAny])  # anyone can access login
def login_view(request):
    email = request.data.get("email")
    password = request.data.get("password")
    user = authenticate(username=email, password=password)

    if user:
        sync_role_flags(user)
        sync_user_project_links_for_user(user)
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "user": _serialize_user(user)
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
        sync_role_flags(request.user)
        sync_user_project_links_for_user(request.user)
        return Response({"user": _serialize_user(request.user)}, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_users(request):
    if not _is_superadmin(request.user):
        return Response({"error": "Superadmin access required."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        users = User.objects.order_by('email')
        return Response(
            {
                "users": [_serialize_user(user) for user in users],
                "available_roles": [{"value": value, "label": label} for value, label in User.Role.choices],
            },
            status=status.HTTP_200_OK,
        )

    data = request.data
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    full_name = (data.get('full_name') or '').strip()
    phone = (data.get('phone') or '').strip()
    role = (data.get('role') or User.Role.PARTICIPANT).strip().upper()

    if not email or not password or not full_name:
        return Response(
            {"error": "full_name, email, and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if role not in User.Role.values:
        return Response({"error": "Invalid role selected."}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email__iexact=email).exists():
        return Response({"error": "A user with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

    user = User(
        username=email,
        email=email,
        full_name=full_name,
        phone=phone,
        role=User.Role.PARTICIPANT,
    )
    user.set_password(password)
    user.save()
    assign_global_role(user, role)
    sync_user_project_links_for_user(user)

    return Response(
        {
            "message": "User created successfully.",
            "user": _serialize_user(user),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def update_managed_user(request, user_id):
    if not _is_superadmin(request.user):
        return Response({"error": "Superadmin access required."}, status=status.HTTP_403_FORBIDDEN)

    try:
        target_user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        if target_user.id == request.user.id:
            return Response(
                {"error": "You cannot delete your own account from this page."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if target_user.role == User.Role.SUPERADMIN and _count_other_superadmins(target_user.pk) == 0:
            return Response(
                {"error": "At least one superadmin must remain in the system."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_user.delete()
        return Response({"message": "User deleted successfully."}, status=status.HTTP_200_OK)

    role = (
        (request.data.get('role') or target_user.role).strip().upper()
        if 'role' in request.data
        else target_user.role
    )
    if role not in User.Role.values:
        return Response({"error": "Invalid role selected."}, status=status.HTTP_400_BAD_REQUEST)

    full_name = (
        (request.data.get('full_name') or '').strip()
        if 'full_name' in request.data
        else (target_user.full_name or '').strip()
    )
    email = (
        (request.data.get('email') or '').strip().lower()
        if 'email' in request.data
        else (target_user.email or '').strip().lower()
    )
    phone = (
        (request.data.get('phone') or '').strip()
        if 'phone' in request.data
        else (target_user.phone or '').strip()
    )
    school = (
        (request.data.get('school') or '').strip()
        if 'school' in request.data
        else (target_user.school or '').strip()
    )
    degree = (
        (request.data.get('degree') or '').strip()
        if 'degree' in request.data
        else (target_user.degree or '').strip()
    )
    course = (
        (request.data.get('course') or '').strip()
        if 'course' in request.data
        else (target_user.course or '').strip()
    )
    roll_no = (
        (request.data.get('roll_no') or '').strip()
        if 'roll_no' in request.data
        else (target_user.roll_no or '').strip()
    )
    sex = (
        (request.data.get('sex') or '').strip().lower()
        if 'sex' in request.data
        else (target_user.sex or '').strip().lower()
    )
    current_year = (
        (request.data.get('current_year') or '').strip()
        if 'current_year' in request.data
        else (target_user.current_year or '').strip()
    )
    position = (
        (request.data.get('position') or '').strip()
        if 'position' in request.data
        else (target_user.position or '').strip()
    )
    password = request.data.get('password') if 'password' in request.data else None

    if not full_name or not email:
        return Response({"error": "full_name and email are required."}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email__iexact=email).exclude(pk=target_user.pk).exists():
        return Response({"error": "A user with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

    if target_user.id == request.user.id and role != User.Role.SUPERADMIN:
        return Response(
            {"error": "You cannot remove your own superadmin access from this page."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if target_user.role == User.Role.SUPERADMIN and role != User.Role.SUPERADMIN and _count_other_superadmins(target_user.pk) == 0:
        return Response(
            {"error": "At least one superadmin must remain in the system."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    target_user.full_name = full_name
    target_user.email = email
    target_user.username = email
    target_user.phone = phone
    target_user.school = school or None
    target_user.degree = degree or None
    target_user.course = course or None
    target_user.roll_no = roll_no or None
    target_user.sex = sex or None
    target_user.current_year = current_year or None
    target_user.position = position or None
    if password:
        target_user.set_password(password)
    target_user.save()

    assign_global_role(target_user, role)
    sync_user_project_links_for_user(target_user)

    return Response(
        {
            "message": "User updated successfully.",
            "user": _serialize_user(target_user),
        },
        status=status.HTTP_200_OK,
    )
