from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    THEME_LIGHT = "light"
    THEME_DARK = "dark"
    THEME_CHOICES = [
        (THEME_LIGHT, "Light"),
        (THEME_DARK, "Dark"),
    ]

    FONT_SMALL = "small"
    FONT_MEDIUM = "medium"
    FONT_LARGE = "large"
    FONT_SIZE_CHOICES = [
        (FONT_SMALL, "Small"),
        (FONT_MEDIUM, "Medium"),
        (FONT_LARGE, "Large"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default=THEME_LIGHT)
    font_size = models.CharField(
        max_length=10, choices=FONT_SIZE_CHOICES, default=FONT_MEDIUM
    )

    def __str__(self):
        return f"Profile for {self.user.username}"
