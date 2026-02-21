import pytest
from backend.repositories.profile_repository import ProfileRepository
from backend.repositories.job_repository import JobRepository
from backend.models import SearchProfile
from backend.models import Job

# We use the db_session fixture provided by our global conftest.py
# If tests run in isolation from test_integration, we might need to rely on the db_session.

@pytest.fixture
def profile_repo(db_session):
    return ProfileRepository(db_session)

@pytest.fixture
def job_repo(db_session):
    return JobRepository(db_session)

def test_profile_repository_create_and_get(profile_repo, test_user):
    data = {
        "user_id": test_user.id,
        "name": "Repo Test Profile",
        "role_description": "Architect",
        "scrape_mode": "sequential"
    }
    profile = profile_repo.create(data)
    
    assert profile.id is not None
    assert profile.name == "Repo Test Profile"

    # Fetch back
    fetched = profile_repo.get(profile.id)
    assert fetched.role_description == "Architect"

def test_profile_repository_update(profile_repo, test_user):
    data = {"user_id": test_user.id, "name": "Initial Name"}
    profile = profile_repo.create(data)
    
    updated = profile_repo.update(profile, {"name": "Updated Name", "max_queries": 10})
    assert updated.name == "Updated Name"
    assert updated.max_queries == 10

def test_job_repository_create_and_get(job_repo, profile_repo, test_user):
    profile = profile_repo.create({"user_id": test_user.id, "name": "Job Host"})
    
    job = {
        "user_id": test_user.id,
        "search_profile_id": profile.id,
        "title": "Test Job Record",
        "company": "Test Company",
        "url": "http://test.com",
        "is_scraped": True
    }
    job_model = job_repo.create(job)
    assert job_model.id is not None

    jobs = job_repo.get_by_user_filtered(test_user.id, skip=0, limit=10)
    total = job_repo.count_by_user_filtered(test_user.id)
    assert total >= 1
    titles = [j.title for j in jobs]
    assert "Test Job Record" in titles

def test_job_repository_filtering(job_repo, profile_repo, test_user):
    profile1 = profile_repo.create({"user_id": test_user.id, "name": "Profile 1"})
    profile2 = profile_repo.create({"user_id": test_user.id, "name": "Profile 2"})

    job_repo.create({"user_id": test_user.id, "search_profile_id": profile1.id, "title": "Job Profile 1", "company": "Corp", "url": "", "is_scraped": True})
    job_repo.create({"user_id": test_user.id, "search_profile_id": profile2.id, "title": "Job Profile 2", "company": "Corp", "url": "", "is_scraped": True})

    jobs_p1 = job_repo.get_by_user_filtered(test_user.id, skip=0, limit=10, search_profile_id=profile1.id)
    total_p1 = job_repo.count_by_user_filtered(test_user.id, search_profile_id=profile1.id)
    assert total_p1 == 1
    assert jobs_p1[0].title == "Job Profile 1"
    
    stats = job_repo.get_stats_by_user_filtered(test_user.id, search_profile_id=profile2.id)
    assert "total_applied" in stats
