import pytest

class TestAdvancedAuthenticationAPI:

    def test_register_user_success(self, client):
        response = client.post(
            "/api/v1/auth/register",
            json={"username": "new_auth_user", "password": "securepassword"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "new_auth_user"
        assert "id" in data

    def test_register_user_duplicate_fails(self, client, test_user):
        response = client.post(
            "/api/v1/auth/register",
            json={"username": "globaladmin", "password": "newpassword123"}
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_register_user_validation_error(self, client):
        # Missing password field
        response = client.post(
            "/api/v1/auth/register",
            json={"username": "invalid_payload"}
        )
        assert response.status_code == 422 # Pydantic Validation error

    def test_login_success_returns_jwt(self, client, test_user):
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "globaladmin", "password": "globalpass"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        
    def test_login_invalid_credentials(self, client, test_user):
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "globaladmin", "password": "WRONG_PASSWORD"}
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect username or password"
        assert response.headers.get("WWW-Authenticate") == "Bearer"

    def test_login_nonexistent_user(self, client):
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "does_not_exist", "password": "password"}
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect username or password"
