import pytest
from fastapi.testclient import TestClient
from backend.main import app

def test_register_login_flow(client: TestClient):
    # 1. Register a new user
    reg_data = {"username": "newuser", "password": "Newpassword1"}
    response = client.post("/api/v1/auth/register", json=reg_data)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "newuser"
    assert "access_token" in data

    # 2. Try to register same user again
    response = client.post("/api/v1/auth/register", json=reg_data)
    assert response.status_code == 400
    assert "Username already registered" in response.json()["detail"]

    # 3. Login with correct credentials
    login_data = {"username": "newuser", "password": "Newpassword1"}
    response = client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    assert "access_token" in response.json()

    # 4. Login with wrong password
    login_data = {"username": "newuser", "password": "Wrongpassword1"}
    response = client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]

def test_login_non_existent_user(client: TestClient):
    login_data = {"username": "ghost", "password": "somepassword"}
    response = client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 401
