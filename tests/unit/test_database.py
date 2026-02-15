"""Unit tests for database models."""

import pytest
from backend.models import User, Job, SearchProfile


class TestUserModel:
    """Test User ORM model."""

    def test_create_user(self, db_session):
        """Should create a user record."""
        user = User(
            username="testuser",
            hashed_password="salt:fakehash",
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        assert user.id is not None
        assert user.username == "testuser"

    def test_unique_username(self, db_session):
        """Should enforce unique username constraint."""
        user1 = User(username="unique_user", hashed_password="hash1")
        db_session.add(user1)
        db_session.commit()

        user2 = User(username="unique_user", hashed_password="hash2")
        db_session.add(user2)
        with pytest.raises(Exception):  # IntegrityError
            db_session.commit()
        db_session.rollback()


class TestJobModel:
    """Test Job ORM model."""

    def test_create_job(self, db_session):
        """Should create a job record linked to a user."""
        user = User(username="jobuser", hashed_password="hash")
        db_session.add(user)
        db_session.commit()

        job = Job(
            user_id=user.id,
            title="Software Engineer",
            company="Test Corp",
            url="https://example.com/job/1",
            location="Zürich",
        )
        db_session.add(job)
        db_session.commit()
        db_session.refresh(job)

        assert job.id is not None
        assert job.title == "Software Engineer"
        assert job.user_id == user.id
        assert job.applied is False  # default

    def test_job_defaults(self, db_session):
        """Should use sensible defaults."""
        user = User(username="defaultsuser", hashed_password="hash")
        db_session.add(user)
        db_session.commit()

        job = Job(
            user_id=user.id,
            title="Test",
            company="Test",
            url="https://example.com",
        )
        db_session.add(job)
        db_session.commit()
        db_session.refresh(job)

        assert job.is_scraped is False
        assert job.applied is False
        assert job.worth_applying is False


class TestSearchProfileModel:
    """Test SearchProfile ORM model."""

    def test_create_profile(self, db_session):
        """Should create a search profile linked to a user."""
        user = User(username="profileuser", hashed_password="hash")
        db_session.add(user)
        db_session.commit()

        profile = SearchProfile(
            user_id=user.id,
            name="Zürich Python Jobs",
            location_filter="Zürich",
            posted_within_days=14,
        )
        db_session.add(profile)
        db_session.commit()
        db_session.refresh(profile)

        assert profile.id is not None
        assert profile.name == "Zürich Python Jobs"
        assert profile.schedule_enabled is False  # default
