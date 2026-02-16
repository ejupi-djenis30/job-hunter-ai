"""Integration tests for FastAPI endpoints."""

import pytest


class TestHealthEndpoint:
    """Test the root health/info endpoint."""

    def test_root_endpoint(self, client):
        """GET / should return a welcome message."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


class TestAuthEndpoints:
    """Test registration and login flow."""

    def test_register_user(self, client):
        """POST /auth/register should create a new user."""
        response = client.post("/api/v1/auth/register", json={
            "username": "newuser",
            "password": "SecureP@ss123",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "newuser"
        assert data["username"] == "newuser"
        # assert "access_token" in data  <-- Removed, we now require explicit login

    def test_register_duplicate_username(self, client):
        """Should reject duplicate username registration."""
        user_data = {
            "username": "duplicateuser",
            "password": "Pass123!",
        }
        client.post("/api/v1/auth/register", json=user_data)

        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 400

    def test_login_success(self, client):
        """Should login and return JWT token."""
        client.post("/api/v1/auth/register", json={
            "username": "logintest",
            "password": "Test1234!",
        })

        response = client.post("/api/v1/auth/login", data={
            "username": "logintest",
            "password": "Test1234!",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["username"] == "logintest"

    def test_login_wrong_password(self, client):
        """Should reject wrong password."""
        client.post("/api/v1/auth/register", json={
            "username": "wrongpwuser",
            "password": "Correct123!",
        })

        response = client.post("/api/v1/auth/login", data={
            "username": "wrongpwuser",
            "password": "Wrong123!",
        })
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        """Should reject login for nonexistent user."""
        response = client.post("/api/v1/auth/login", data={
            "username": "nobody",
            "password": "Test123!",
        })
        assert response.status_code == 401


class TestProtectedEndpoints:
    """Test endpoints that require authentication."""

    def _get_auth_headers(self, client, username=None) -> dict:
        """Helper: register, login, and return auth headers."""
        import uuid
        if username is None:
            username = f"auth-{uuid.uuid4().hex[:8]}"

        client.post("/api/v1/auth/register", json={
            "username": username,
            "password": "AuthTest123!",
        })

        response = client.post("/api/v1/auth/login", data={
            "username": username,
            "password": "AuthTest123!",
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    def test_get_jobs_unauthenticated(self, client):
        """Should reject unauthenticated requests."""
        response = client.get("/api/v1/jobs")
        assert response.status_code in (401, 403)

    def test_get_jobs_authenticated(self, client):
        """Should return jobs for authenticated user."""
        headers = self._get_auth_headers(client)
        response = client.get("/api/v1/jobs", headers=headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_profiles_authenticated(self, client):
        """Should return search profiles for authenticated user."""
        headers = self._get_auth_headers(client)
        response = client.get("/api/v1/profiles", headers=headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
