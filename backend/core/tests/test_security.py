from django.contrib.auth.models import User, Group
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
import json

class SecurityTests(TestCase):
    def setUp(self):
        # Admin User
        self.admin_user = User.objects.create_superuser(username="admin_sec", password="pass1234")
        self.admin_token = str(RefreshToken.for_user(self.admin_user).access_token)
        
        # Grouped User (Docente)
        self.docente_group = Group.objects.create(name="Docente")
        self.docente_user = User.objects.create_user(username="profesor", password="pass1234")
        self.docente_user.groups.add(self.docente_group)
        self.docente_token = str(RefreshToken.for_user(self.docente_user).access_token)

        # Ungrouped User (No access)
        self.random_user = User.objects.create_user(username="random", password="pass1234")
        self.random_token = str(RefreshToken.for_user(self.random_user).access_token)

        self.client = APIClient()

    def test_unauthorized_access(self):
        """Test access without token"""
        self.client.credentials() # No auth
        resp = self.client.get("/api/v2/estudiantes")
        self.assertEqual(resp.status_code, 401, f"Expected 401 for anonymous, got {resp.status_code}")

    def test_ungrouped_user_forbidden(self):
        """Test access with token but no group"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.random_token}")
        resp = self.client.get("/api/v2/estudiantes")
        self.assertEqual(resp.status_code, 403, f"Expected 403 for ungrouped user, got {resp.status_code}")

    def test_grouped_user_allowed(self):
        """Test access with token AND group"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.docente_token}")
        resp = self.client.get("/api/v2/estudiantes")
        self.assertEqual(resp.status_code, 200, f"Expected 200 for docente, got {resp.status_code}")
