import pytest
from fastapi.testclient import TestClient

def test_profiles_crud_flow(client: TestClient, auth_headers: dict):
    # 1. Create profile
    profile_data = {
        "name": "Test Profile",
        "role_description": "DevOps",
        "search_strategy": "Aggressive"
    }
    response = client.post("/api/v1/profiles/", json=profile_data, headers=auth_headers)
    assert response.status_code == 200
    profile_id = response.json()["id"]

    # 2. Get profiles
    response = client.get("/api/v1/profiles/", headers=auth_headers)
    assert len(response.json()) >= 1

    # 3. Toggle schedule
    response = client.patch(f"/api/v1/profiles/{profile_id}/schedule", json={"enabled": True, "interval_hours": 24}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["schedule_enabled"] is True

    # 4. Delete profile
    response = client.delete(f"/api/v1/profiles/{profile_id}", headers=auth_headers)
    assert response.status_code == 200
