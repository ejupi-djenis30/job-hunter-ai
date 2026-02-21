"""Unit tests for Pydantic request/response schemas."""

import pytest
from datetime import datetime
from pydantic import ValidationError

from backend.schemas import (
    UserCreate, UserLogin, Token,
    JobBase, JobCreate, JobUpdate, Job,
    SearchProfileBase, SearchProfileCreate, SearchProfile,
    ScheduleToggle,
)


class TestAuthSchemas:
    """Test authentication schemas."""

    def test_user_create_valid(self):
        user = UserCreate(username="alice", password="Secret123!")
        assert user.username == "alice"
        assert user.password == "Secret123!"

    def test_user_create_missing_field(self):
        with pytest.raises(ValidationError):
            UserCreate(username="alice")

    def test_user_login_valid(self):
        login = UserLogin(username="alice", password="Secret123!")
        assert login.username == "alice"

    def test_token_defaults(self):
        token = Token(access_token="abc.def.ghi", username="alice")
        assert token.token_type == "bearer"
        assert token.access_token == "abc.def.ghi"

    def test_token_custom_type(self):
        token = Token(access_token="abc", token_type="mac", username="alice")
        assert token.token_type == "mac"


class TestJobSchemas:
    """Test job-related schemas."""

    def test_job_base_required_fields(self):
        with pytest.raises(ValidationError):
            JobBase(title="Test")  # missing company and url

    def test_job_base_minimal(self):
        job = JobBase(title="Dev", company="Corp", url="https://example.com")
        assert job.title == "Dev"
        assert job.description is None
        assert job.location is None
        assert job.workload is None

    def test_job_create_defaults(self):
        job = JobCreate(title="Dev", company="Corp", url="https://example.com")
        assert job.is_scraped is False
        assert job.worth_applying is False
        assert job.affinity_score is None

    def test_job_create_with_analysis(self):
        job = JobCreate(
            title="Dev",
            company="Corp",
            url="https://example.com",
            is_scraped=True,
            affinity_score=85.5,
            affinity_analysis="Strong match",
            worth_applying=True,
        )
        assert job.affinity_score == 85.5
        assert job.is_scraped is True

    def test_job_update_partial(self):
        update = JobUpdate(applied=True)
        data = update.model_dump(exclude_unset=True)
        assert data == {"applied": True}

    def test_job_update_empty(self):
        update = JobUpdate()
        data = update.model_dump(exclude_unset=True)
        assert data == {}

    def test_job_update_multiple_fields(self):
        update = JobUpdate(applied=True, title="New Title", company="New Corp")
        data = update.model_dump(exclude_unset=True)
        assert len(data) == 3

    def test_job_response_from_attributes(self):
        """Should support from_attributes (orm_mode replacement)."""
        now = datetime.now()
        job = Job(
            id=1,
            title="Dev",
            company="Corp",
            url="https://example.com",
            is_scraped=True,
            applied=False,
            created_at=now,
        )
        assert job.id == 1
        assert job.updated_at is None
        assert job.worth_applying is False


class TestSearchProfileSchemas:
    """Test search profile schemas."""

    def test_profile_base_defaults(self):
        profile = SearchProfileBase()
        assert profile.name == "Default Profile"
        assert profile.posted_within_days == 30
        assert profile.max_distance == 50
        assert profile.scrape_mode == "sequential"
        assert profile.schedule_enabled is False
        assert profile.schedule_interval_hours == 24

    def test_profile_create_inherits(self):
        profile = SearchProfileCreate(
            name="My Search",
            role_description="Python developer",
            location_filter="Zürich",
            workload_filter="80-100%",
        )
        assert profile.name == "My Search"
        assert profile.role_description == "Python developer"

    def test_profile_response_from_attributes(self):
        now = datetime.now()
        profile = SearchProfile(id=1, created_at=now)
        assert profile.id == 1
        assert profile.last_scheduled_run is None

    def test_schedule_toggle(self):
        toggle = ScheduleToggle(enabled=True, interval_hours=12)
        assert toggle.enabled is True
        assert toggle.interval_hours == 12

    def test_schedule_toggle_minimal(self):
        toggle = ScheduleToggle(enabled=False)
        assert toggle.interval_hours is None

    def test_schedule_toggle_missing_enabled(self):
        with pytest.raises(ValidationError):
            ScheduleToggle()
