from django.urls import path

from .views import (
    health_view,
    login_view,
    logout_view,
    me_view,
    process_image,
    profile_view,
)

urlpatterns = [
    path("health/", health_view, name="health"),
    path("process-image/", process_image, name="process_image"),
    path("login/", login_view, name="login"),
    path("logout/", logout_view, name="logout"),
    path("me/", me_view, name="me"),
    path("profile/", profile_view, name="profile"),
]
