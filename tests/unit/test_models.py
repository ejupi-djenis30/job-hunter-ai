"""Unit tests for ORM model relationships and edge cases."""

import pytest
from datetime import datetime, timezone
from backend.models import User, Job, SearchProfile


class TestUserRelationships:
    """Test User model relationships."""

    def test_user_has_jobs_relationship(self, db_session):
        user = User(username="rel_user_jobs", hashed_password="hash")
        db_session.add(user)
        db_session.commit()

        job = Job(user_id=user.id, title="Test", company="Corp", url="https://x.com")
        db_session.add(job)
        db_session.commit()

        db_session.refresh(user)
        assert len(user.jobs) == 1
        assert user.jobs[0].title == "Test"

    def test_user_has_profiles_relationship(self, db_session):
        user = User(username="rel_user_profiles", hashed_password="hash")
        db_session.add(user)
        db_session.commit()

        profile = SearchProfile(user_id=user.id, name="Test Profile")
        db_session.add(profile)
        db_session.commit()

        db_session.refresh(user)
        assert len(user.profiles) == 1
        assert user.profiles[0].name == "Test Profile"

    def test_user_multiple_jobs(self, db_session):
        user = User(username="multi_jobs_user", hashed_password="hash")
        db_session.add(user)
        db_session.commit()

        for i in range(5):
            db_session.add(Job(
                user_id=user.id,
                title=f"Job {i}",
                company="Corp",
                url=f"https://example.com/{i}",
            ))
        db_session.commit()
        db_session.refresh(user)
        assert len(user.jobs) == 5


class TestJobModel:
    """Test Job model fields and edge cases."""

    def test_job_all_fields(self, db_session):
        user = User(username="full_job_user", hashed_password="hash")
        db_session.add(user)
        db_session.commit()

        job = Job(
            user_id=user.id,
            title="Senior Python Dev",
            company="Swiss Corp AG",
            description="Build amazing things",
            location="Zürich",
            url="https://example.com/job/42",
            jobroom_url="https://www.job-room.ch/job/42",
            application_email="hr@swiss.ch",
            workload="80-100%",
            publication_date=datetime(2024, 1, 15, tzinfo=timezone.utc),
            is_scraped=True,
            source_query="Python Developer",
            affinity_score=85.5,
            affinity_analysis="Strong match for backend role",
            worth_applying=True,
            applied=False,
        )
        db_session.add(job)
        db_session.commit()
        db_session.refresh(job)

        assert job.title == "Senior Python Dev"
        assert job.affinity_score == 85.5
        assert job.worth_applying is True
        assert job.applied is False
        assert job.source_query == "Python Developer"
        assert job.created_at is not None

    def test_job_nullable_fields(self, db_session):
        user = User(username="nullable_job_user", hashed_password="hash")
        db_session.add(user)
        db_session.commit()

        job = Job(
            user_id=user.id,
            title="Minimal",
            company="X",
            url="https://x.com",
        )
        db_session.add(job)
        db_session.commit()
        db_session.refresh(job)

        assert job.description is None
        assert job.location is None
        assert job.jobroom_url is None
        assert job.application_email is None
        assert job.affinity_score is None
        assert job.affinity_analysis is None

    def test_job_back_populates_user(self, db_session):
        user = User(username="backpop_user", hashed_password="hash")
        db_session.add(user)
        db_session.commit()

        job = Job(user_id=user.id, title="Test", company="X", url="https://x.com")
        db_session.add(job)
        db_session.commit()
        db_session.refresh(job)

        assert job.user.username == "backpop_user"


class TestSearchProfileModel:
    """Test SearchProfile model fields and edge cases."""

    def test_profile_all_fields(self, db_session):
        user = User(username="full_profile_user", hashed_password="hash")
        db_session.add(user)
        db_session.commit()

        profile = SearchProfile(
            user_id=user.id,
            name="My Search",
            cv_content="Experienced Python developer...",
            role_description="Backend developer with Python and FastAPI",
            search_strategy="Focus on remote positions",
            location_filter="Zürich",
            workload_filter="80-100%",
            posted_within_days=14,
            max_distance=30,
            latitude=47.3769,
            longitude=8.5417,
            scrape_mode="parallel",
            schedule_enabled=True,
            schedule_interval_hours=12,
        )
        db_session.add(profile)
        db_session.commit()
        db_session.refresh(profile)

        assert profile.name == "My Search"
        assert profile.latitude == 47.3769
        assert profile.schedule_enabled is True
        assert profile.schedule_interval_hours == 12

    def test_profile_defaults(self, db_session):
        user = User(username="defaults_profile_user", hashed_password="hash")
        db_session.add(user)
        db_session.commit()

        profile = SearchProfile(user_id=user.id)
        db_session.add(profile)
        db_session.commit()
        db_session.refresh(profile)

        assert profile.name == "Default Profile"
        assert profile.posted_within_days == 30
        assert profile.max_distance == 50
        assert profile.scrape_mode == "sequential"
        assert profile.schedule_enabled is False
        assert profile.schedule_interval_hours == 24

    def test_profile_back_populates_user(self, db_session):
        user = User(username="profile_backpop", hashed_password="hash")
        db_session.add(user)
        db_session.commit()

        profile = SearchProfile(user_id=user.id, name="Test")
        db_session.add(profile)
        db_session.commit()
        db_session.refresh(profile)

        assert profile.user.username == "profile_backpop"
