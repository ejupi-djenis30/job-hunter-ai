import pytest
from backend.models import Job
from backend.models import SearchProfile


@pytest.fixture
def setup_job_data(db_session, test_user):
    # Create profile
    profile = SearchProfile(user_id=test_user.id, name="Job Data Tests")
    db_session.add(profile)
    db_session.flush()

    # Create dummy jobs
    job1 = Job(user_id=test_user.id, search_profile_id=profile.id, title="Backend Dev", company="A", affinity_score=100, is_scraped=True, url="http://a")
    job2 = Job(user_id=test_user.id, search_profile_id=profile.id, title="Frontend Dev", company="B", affinity_score=40, worth_applying=True, is_scraped=True, url="http://b")
    job3 = Job(user_id=test_user.id, search_profile_id=profile.id, title="QA Auto", company="C", affinity_score=0, applied=True, is_scraped=True, url="http://c")
    
    db_session.add_all([job1, job2, job3])
    db_session.commit()
    
    return profile.id, [job1.id, job2.id, job3.id]


class TestAdvancedJobsAPI:
    def test_get_all_jobs_pagination(self, client, auth_headers, setup_job_data):
        prof_id, job_ids = setup_job_data
        
        response = client.get("/api/v1/jobs/?page=1&page_size=2", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2 # Testing strict limit adherence
        assert data["total"] >= 3

    def test_get_jobs_filter_by_profile(self, client, auth_headers, setup_job_data):
        prof_id, job_ids = setup_job_data
        
        response = client.get(f"/api/v1/jobs/?search_profile_id={prof_id}", headers=auth_headers)
        data = response.json()
        assert data["total"] == 3
        # Should be ordered descendingly by default
        titles = [j["title"] for j in data["items"]]
        assert "Backend Dev" in titles

    def test_get_jobs_filter_by_status_applied(self, client, auth_headers, setup_job_data):
        prof_id, job_ids = setup_job_data
        response = client.get(f"/api/v1/jobs/?applied=true", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        applied_titles = [j["title"] for j in data["items"]]
        assert "QA Auto" in applied_titles
        assert "Backend Dev" not in applied_titles

    def test_get_jobs_filter_by_worth_applying(self, client, auth_headers, setup_job_data):
        prof_id, job_ids = setup_job_data
        response = client.get(f"/api/v1/jobs/?worth_applying=true", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify that all returned items have worth_applying == True
        for item in data["items"]:
            assert item["worth_applying"] is True

    def test_apply_to_job(self, client, auth_headers, setup_job_data):
        prof_id, job_ids = setup_job_data
        # QA Auto is job_ids[2] which is already applied, let's mark Backend Dev (job_ids[0]) as applied
        job_to_apply = job_ids[0]
        
        response = client.patch(f"/api/v1/jobs/{job_to_apply}", json={"applied": True}, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["applied"] is True

        # Unapply it
        response2 = client.patch(f"/api/v1/jobs/{job_to_apply}", json={"applied": False}, headers=auth_headers)
        assert response2.status_code == 200
        assert response2.json()["applied"] is False

    def test_apply_job_not_found(self, client, auth_headers):
        response = client.patch("/api/v1/jobs/999999", json={"applied": True}, headers=auth_headers)
        assert response.status_code == 404
        assert response.json()["detail"] == "Job not found"
