from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient, APITestCase

from .models import UserProfile


class TestAuthAndUserApi(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="demo",
            password="demo1234",
            email="demo@example.com",
            first_name="Demo",
            last_name="User",
        )
        self.client = APIClient()

    def test_login_returns_token_for_valid_credentials(self):
        response = self.client.post(
            "/api/login/",
            {"username": "demo", "password": "demo1234"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("token", response.data)

    def test_login_returns_error_for_invalid_credentials(self):
        response = self.client.post(
            "/api/login/",
            {"username": "demo", "password": "wrong"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Invalid username or password.")

    def test_me_endpoint_requires_authentication(self):
        response = self.client.get("/api/me/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_endpoint_requires_authentication(self):
        response = self.client.get("/api/profile/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_read_current_user_data(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "demo")
        self.assertEqual(response.data["first_name"], "Demo")
        self.assertEqual(response.data["last_name"], "User")
        self.assertEqual(response.data["email"], "demo@example.com")

    def test_authenticated_user_can_read_profile_data(self):
        UserProfile.objects.create(user=self.user, theme="dark", font_size="large")
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/profile/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["theme"], "dark")
        self.assertEqual(response.data["font_size"], "large")

    def test_authenticated_user_can_update_first_and_last_name(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            "/api/me/",
            {"first_name": "Anna", "last_name": "Smith"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Anna")
        self.assertEqual(self.user.last_name, "Smith")

    def test_me_update_ignores_read_only_fields(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            "/api/me/",
            {
                "username": "hacker",
                "email": "hacker@example.com",
                "first_name": "Demo2",
                "last_name": "User2",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "demo")
        self.assertEqual(self.user.email, "demo@example.com")
        self.assertEqual(self.user.first_name, "Demo2")
        self.assertEqual(self.user.last_name, "User2")


class TestHealthCheck(APITestCase):
    def test_health_check_returns_ok(self):
        response = self.client.get("/api/health/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"status": "ok"})


class TestTokenFlow(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="token-user", password="tokenpass123"
        )

    def test_login_token_can_access_protected_endpoints(self):
        login_response = self.client.post(
            "/api/login/",
            {"username": "token-user", "password": "tokenpass123"},
            format="json",
        )

        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        token_key = login_response.data["token"]

        api_client = APIClient()
        api_client.credentials(HTTP_AUTHORIZATION=f"Token {token_key}")

        me_response = api_client.get("/api/me/")
        profile_response = api_client.get("/api/profile/")

        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)

    def test_logout_invalidates_token(self):
        token = Token.objects.create(user=self.user)
        api_client = APIClient()
        api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        logout_response = api_client.post("/api/logout/")
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

        me_response = api_client.get("/api/me/")
        self.assertEqual(me_response.status_code, status.HTTP_401_UNAUTHORIZED)
