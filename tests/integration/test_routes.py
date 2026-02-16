"""Integration tests for job CRUD, profile, and schedule API routes."""

import uuid
import pytest


def _register_and_auth(client, username=None) -> dict:
    """Helper: register a user and return auth headers."""
    if username is None:
        username = f"test-{uuid.uuid4().hex[:8]}"

    client.post("/api/v1/auth/register", json={
        "username": username,
        "password": "TestPass123!",
    })
    resp = client.post("/api/v1/auth/login", data={
        "username": username,
        "password": "TestPass123!",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestJobCRUD:
    """Test /jobs endpoints."""

    def test_create_job(self, client):
        headers = _register_and_auth(client)
        resp = client.post("/api/v1/jobs/", json={
            "title": "Python Developer",
            "company": "TestCorp",
            "url": "https://example.com/job/1",
            "location": "Zürich",
        }, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Python Developer"
        assert data["company"] == "TestCorp"
        assert data["applied"] is False
        assert data["is_scraped"] is False
        assert data["id"] is not None

    def test_list_jobs_empty(self, client):
        headers = _register_and_auth(client)
        resp = client.get("/api/v1/jobs/", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_jobs_after_create(self, client):
        headers = _register_and_auth(client)
        client.post("/api/v1/jobs/", json={
            "title": "Job A",
            "company": "Corp",
            "url": "https://example.com/a",
        }, headers=headers)
        client.post("/api/v1/jobs/", json={
            "title": "Job B",
            "company": "Corp",
            "url": "https://example.com/b",
        }, headers=headers)
        resp = client.get("/api/v1/jobs/", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_patch_job_applied(self, client):
        headers = _register_and_auth(client)
        create_resp = client.post("/api/v1/jobs/", json={
            "title": "Patch Test",
            "company": "Corp",
            "url": "https://example.com/patch",
        }, headers=headers)
        job_id = create_resp.json()["id"]

        resp = client.patch(f"/api/v1/jobs/{job_id}", json={
            "applied": True
        }, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["applied"] is True

    def test_patch_job_title(self, client):
        headers = _register_and_auth(client)
        create_resp = client.post("/api/v1/jobs/", json={
            "title": "Old Title",
            "company": "Corp",
            "url": "https://example.com/title",
        }, headers=headers)
        job_id = create_resp.json()["id"]

        resp = client.patch(f"/api/v1/jobs/{job_id}", json={
            "title": "New Title"
        }, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["title"] == "New Title"

    def test_patch_nonexistent_job(self, client):
        headers = _register_and_auth(client)
        resp = client.patch("/api/v1/jobs/99999", json={
            "applied": True
        }, headers=headers)
        assert resp.status_code == 404

    def test_update_job_full(self, client):
        headers = _register_and_auth(client)
        create_resp = client.post("/api/v1/jobs/", json={
            "title": "Original",
            "company": "OldCorp",
            "url": "https://example.com/old",
        }, headers=headers)
        job_id = create_resp.json()["id"]

        resp = client.patch(f"/api/v1/jobs/{job_id}", json={
            "title": "Updated",
            "company": "NewCorp",
            "url": "https://example.com/new",
            "location": "Bern",
        }, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Updated"
        assert data["company"] == "NewCorp"

    def test_update_nonexistent_job(self, client):
        headers = _register_and_auth(client)
        resp = client.patch("/api/v1/jobs/99999", json={
            "title": "X",
            "company": "X",
            "url": "https://x.com",
        }, headers=headers)
        assert resp.status_code == 404

    def test_jobs_isolated_between_users(self, client):
        """User A should not see User B's jobs."""
        headers_a = _register_and_auth(client)
        headers_b = _register_and_auth(client)

        client.post("/api/v1/jobs/", json={
            "title": "A's Job",
            "company": "Corp",
            "url": "https://example.com/a",
        }, headers=headers_a)

        resp = client.get("/api/v1/jobs/", headers=headers_b)
        assert resp.status_code == 200
        assert len(resp.json()) == 0

    def test_filter_jobs_by_applied(self, client):
        headers = _register_and_auth(client)
        create_resp = client.post("/api/v1/jobs/", json={
            "title": "Applied Job",
            "company": "Corp",
            "url": "https://example.com/applied",
        }, headers=headers)
        job_id = create_resp.json()["id"]
        client.patch(f"/api/v1/jobs/{job_id}", json={"applied": True}, headers=headers)

        client.post("/api/v1/jobs/", json={
            "title": "Not Applied",
            "company": "Corp",
            "url": "https://example.com/notapplied",
        }, headers=headers)

        # Filter applied=true
        resp = client.get("/api/v1/jobs/?applied=true", headers=headers)
        assert resp.status_code == 200
        assert all(j["applied"] for j in resp.json())

        # Filter applied=false
        resp = client.get("/api/v1/jobs/?applied=false", headers=headers)
        assert resp.status_code == 200
        assert all(not j["applied"] for j in resp.json())


class TestProfileRoutes:
    """Test /profiles endpoints."""

    def test_list_profiles_empty(self, client):
        headers = _register_and_auth(client)
        resp = client.get("/api/v1/profiles/", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_delete_profile(self, client):
        headers = _register_and_auth(client)

        # Create via search/start to get a profile
        resp = client.post("/api/v1/search/start", json={
            "name": "Delete Me",
            "role_description": "test",
            "location_filter": "Zürich",
        }, headers=headers)
        profile_id = resp.json().get("profile_id")
        if profile_id is None:
            pytest.skip("Profile creation via search/start not returning profile_id")

        # Delete it
        resp = client.delete(f"/api/v1/profiles/{profile_id}", headers=headers)
        assert resp.status_code == 200
        assert "deleted" in resp.json()["message"].lower()

    def test_delete_nonexistent_profile(self, client):
        headers = _register_and_auth(client)
        resp = client.delete("/api/v1/profiles/99999", headers=headers)
        assert resp.status_code == 404

    def test_profiles_unauthenticated(self, client):
        resp = client.get("/api/v1/profiles/")
        assert resp.status_code in (401, 403)


class TestScheduleRoutes:
    """Test schedule-related endpoints."""

    def test_list_schedules_empty(self, client):
        headers = _register_and_auth(client)
        resp = client.get("/api/v1/schedules/", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["schedules"] == []

    def test_scheduler_status(self, client):
        headers = _register_and_auth(client)
        resp = client.get("/api/v1/schedules/status", headers=headers)
        assert resp.status_code == 200
        assert "active_jobs" in resp.json()

    def test_toggle_schedule_nonexistent(self, client):
        headers = _register_and_auth(client)
        resp = client.patch("/api/v1/profiles/99999/schedule", json={
            "enabled": True,
            "interval_hours": 12,
        }, headers=headers)
        assert resp.status_code == 404


class TestSearchRoutes:
    """Test search-related endpoints."""

    def test_search_status_unknown_profile(self, client):
        headers = _register_and_auth(client)
        resp = client.get("/api/v1/search/status/99999", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["state"] == "unknown"

    def test_upload_cv_no_file(self, client):
        headers = _register_and_auth(client)
        resp = client.post("/api/v1/search/upload-cv", headers=headers)
        assert resp.status_code == 422  # Missing file


class TestHealthEndpointExtended:
    """Extended tests for the root endpoint."""

    def test_root_returns_db_type(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "database" in data
        assert data["database"] in ("sqlite", "postgresql")
