import pytest
from fastapi.testclient import TestClient

def test_jobs_crud_flow(client: TestClient, auth_headers: dict):
    # 1. List jobs (empty)
    response = client.get("/api/v1/jobs/", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["total"] == 0

    # 2. Create a job
    job_data = {
        "title": "Integration Test Job",
        "company": "Test Co",
        "platform": "test",
        "platform_job_id": "tp1",
        "external_url": "http://test.com/job1"
    }
    response = client.post("/api/v1/jobs/", json=job_data, headers=auth_headers)
    assert response.status_code == 200
    job_id = response.json()["id"]

    # 3. Update job
    response = client.patch(f"/api/v1/jobs/{job_id}", json={"applied": True}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["applied"] is True

    # 4. List jobs (1 item)
    response = client.get("/api/v1/jobs/", headers=auth_headers)
    assert response.json()["total"] == 1
