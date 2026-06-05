import base64
from io import BytesIO

from django.contrib.auth import authenticate
from django.utils import timezone
from PIL import Image, UnidentifiedImageError
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import UserProfile
from .serializers import (
    CurrentUserSerializer,
    CurrentUserUpdateSerializer,
    UserProfileSerializer,
)


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def health_view(request):
    return Response({"status": "ok"}, status=status.HTTP_200_OK)


@api_view(["POST"])
def process_image(request):
    """Receive an uploaded image, convert it to grayscale, and return base64 JSON."""
    uploaded_file = request.FILES.get("image")
    if uploaded_file is None:
        return Response(
            {"error": "Please upload an image file using the 'image' field."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        grayscale_image = Image.open(uploaded_file).convert("L")
    except UnidentifiedImageError:
        return Response(
            {"error": "The uploaded file is not a valid image."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    output_buffer = BytesIO()
    grayscale_image.save(output_buffer, format="PNG")
    encoded_image = base64.b64encode(output_buffer.getvalue()).decode("utf-8")

    return Response({"image": encoded_image}, status=status.HTTP_200_OK)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    user = authenticate(username=username, password=password)
    if user is None:
        return Response(
            {"error": "Invalid username or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    token, _ = Token.objects.get_or_create(user=user)
    user.last_login = timezone.now()
    user.save(update_fields=["last_login"])
    return Response({"token": token.key}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    request.auth.delete()
    return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me_view(request):
    if request.method == "GET":
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    serializer = CurrentUserUpdateSerializer(
        request.user, data=request.data, partial=True
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    response_serializer = CurrentUserSerializer(request.user)
    return Response(response_serializer.data, status=status.HTTP_200_OK)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    serializer = UserProfileSerializer(profile, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_200_OK)
