from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from core.api.auth_endpoints import ACCESS_COOKIE, REFRESH_COOKIE

class AuthTests(TestCase):
    def setUp(self):
        self.username = "testuser"
        self.password = "password123"
        self.user = User.objects.create_user(username=self.username, password=self.password)
        self.client = APIClient()

    def test_login_success(self):
        """Test login with valid credentials sets HTTP-only cookies."""
        resp = self.client.post("/api/v2/token", {"username": self.username, "password": self.password}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("detail", resp.json())
        self.assertEqual(resp.json()["detail"], "Login exitoso.")
        
        # Verify cookies are set
        self.assertIn(ACCESS_COOKIE, resp.cookies)
        self.assertIn(REFRESH_COOKIE, resp.cookies)
        self.assertTrue(resp.cookies[ACCESS_COOKIE]["httponly"])
        self.assertTrue(resp.cookies[REFRESH_COOKIE]["httponly"])

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401."""
        resp = self.client.post("/api/v2/token", {"username": self.username, "password": "wrongpassword"}, format="json")
        self.assertEqual(resp.status_code, 401)
        self.assertNotIn(ACCESS_COOKIE, resp.cookies)
        self.assertNotIn(REFRESH_COOKIE, resp.cookies)

    def test_token_refresh_success(self):
        """Test token refresh with cookie succeeds and rotates token."""
        login_resp = self.client.post("/api/v2/token", {"username": self.username, "password": self.password}, format="json")
        refresh_token = login_resp.cookies[REFRESH_COOKIE].value
        
        # Call refresh endpoint with the cookie
        self.client.cookies[REFRESH_COOKIE] = refresh_token
        resp = self.client.post("/api/v2/token/refresh")
        
        self.assertEqual(resp.status_code, 200)
        self.assertIn(ACCESS_COOKIE, resp.cookies)
        self.assertIn(REFRESH_COOKIE, resp.cookies)
        
        # Ensure refresh token was rotated (changed)
        new_refresh = resp.cookies[REFRESH_COOKIE].value
        self.assertNotEqual(refresh_token, new_refresh)

    def test_token_refresh_no_cookie(self):
        """Test token refresh without cookie returns 401."""
        resp = self.client.post("/api/v2/token/refresh")
        self.assertEqual(resp.status_code, 401)

    def test_logout(self):
        """Test logout blacklists the token and clears cookies."""
        login_resp = self.client.post("/api/v2/token", {"username": self.username, "password": self.password}, format="json")
        refresh_token = login_resp.cookies[REFRESH_COOKIE].value
        access_token = login_resp.cookies[ACCESS_COOKIE].value
        
        # Logout
        self.client.cookies[REFRESH_COOKIE] = refresh_token
        self.client.cookies[ACCESS_COOKIE] = access_token
        resp = self.client.post("/api/v2/logout")
        
        self.assertEqual(resp.status_code, 200)
        
        # Verify cookies are cleared (max-age=0 or empty value)
        self.assertEqual(resp.cookies[ACCESS_COOKIE].value, "")
        self.assertEqual(resp.cookies[REFRESH_COOKIE].value, "")
        
        # Verify refresh token is blacklisted
        self.assertTrue(OutstandingToken.objects.filter(token=refresh_token).exists())
        self.assertTrue(BlacklistedToken.objects.filter(token__token=refresh_token).exists())
