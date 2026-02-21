import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.main import app
from backend.db.base import Base, get_db
from backend.models import User, SearchProfile, Job
from backend.core.security import get_password_hash

# Setup Testing Database (In-Memory SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client(setup_database):
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
def test_user(setup_database):
    db = TestingSessionLocal()
    user = User(
        username="testadmin",
        hashed_password=get_password_hash("testpass")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    yield user
    db.delete(user)
    db.commit()

@pytest.fixture(scope="module")
def auth_headers(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testadmin", "password": "testpass"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

class TestAuthentication:
    def test_register_user_success(self, client):
        response = client.post(
            "/api/v1/auth/register",
            json={"username": "newuser", "password": "securepassword"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "newuser"
        assert "id" in data

    def test_register_user_duplicate(self, client, test_user):
        response = client.post(
            "/api/v1/auth/register",
            json={"username": "testadmin", "password": "securepassword"}
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Username already registered"

    def test_login_success(self, client, test_user):
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "testadmin", "password": "testpass"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_failure(self, client):
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "wrong", "password": "wrong"}
        )
        assert response.status_code == 401

class TestProfilesFlow:
    def test_create_profile(self, client, auth_headers):
        payload = {
            "name": "Integration Test Profile",
            "role_description": "Senior DevOps Engineer",
            "cv_content": "Docker, Kubernetes, AWS, Python",
            "search_strategy": "Ignore junior roles",
            "location_filter": "Zurich",
            "max_distance": 50,
            "workload_filter": "80-100",
            "max_queries": 5
        }
        response = client.post("/api/v1/search/start", json=payload, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "profile_id" in data
        assert data["message"] == "Search started"

    def test_get_profiles(self, client, auth_headers):
        response = client.get("/api/v1/profiles/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["name"] == "Integration Test Profile"
        assert data[0]["role_description"] == "Senior DevOps Engineer"

class TestJobsFlow:
    @pytest.fixture
    def setup_job(self, auth_headers):
        db = TestingSessionLocal()
        user = db.query(User).filter(User.username == "testadmin").first()
        profile = SearchProfile(
            user_id=user.id,
            name="Job Test Flow",
            role_description="Tester"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        job = Job(
            user_id=user.id,
            search_profile_id=profile.id,
            title="Senior QAutomation Engineer",
            company="TestCorp",
            affinity_score=95,
            worth_applying=True,
            is_scraped=True
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job, profile

    def test_get_jobs_global(self, client, auth_headers, setup_job):
        job, profile = setup_job
        response = client.get("/api/v1/jobs/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        jobs = data["items"]
        titles = [j["title"] for j in jobs]
        assert "Senior QAutomation Engineer" in titles

    def test_get_jobs_filtered(self, client, auth_headers, setup_job):
        job, profile = setup_job
        response = client.get(f"/api/v1/jobs/?search_profile_id={profile.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["title"] == "Senior QAutomation Engineer"
        assert data["avg_score"] == 95

    def test_apply_to_job(self, client, auth_headers, setup_job):
        job, profile = setup_job
        response = client.put(f"/api/v1/jobs/{job.id}/apply?applied=true", headers=auth_headers)
        assert response.status_code == 200
        
        # Verify job is applied
        db = TestingSessionLocal()
        updated_job = db.query(Job).filter(Job.id == job.id).first()
        assert updated_job.applied is True

class TestSearchStatusFlow:
    def test_get_all_statuses_empty(self, client, auth_headers):
        response = client.get("/api/v1/search/status/all", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), dict)
