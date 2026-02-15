"""Unit tests for the scheduler service."""

import pytest
from unittest.mock import patch, MagicMock, PropertyMock

from backend.services.scheduler import (
    get_scheduler,
    add_schedule,
    remove_schedule,
    get_all_schedules,
)


class TestScheduler:
    """Test APScheduler management functions."""

    def setup_method(self):
        """Clean up test jobs between tests."""
        scheduler = get_scheduler()
        for job in scheduler.get_jobs():
            if job.id.startswith("search_profile_90"):
                scheduler.remove_job(job.id)

    def test_get_scheduler_singleton(self):
        """Should return the same scheduler instance."""
        s1 = get_scheduler()
        s2 = get_scheduler()
        assert s1 is s2

    def test_add_schedule_creates_job(self):
        """Adding a schedule should register a job."""
        scheduler = get_scheduler()
        add_schedule(profile_id=9001, interval_hours=6)

        job = scheduler.get_job("search_profile_9001")
        assert job is not None
        assert "9001" in job.name

        remove_schedule(9001)

    def test_add_schedule_replaces_existing(self):
        """Adding a schedule for the same profile should replace the old one."""
        add_schedule(profile_id=9002, interval_hours=12)
        add_schedule(profile_id=9002, interval_hours=6)

        scheduler = get_scheduler()
        jobs = [j for j in scheduler.get_jobs() if j.id == "search_profile_9002"]
        assert len(jobs) == 1

        remove_schedule(9002)

    def test_remove_schedule(self):
        """Removing a schedule should delete the job."""
        add_schedule(profile_id=9003, interval_hours=24)
        remove_schedule(9003)

        scheduler = get_scheduler()
        assert scheduler.get_job("search_profile_9003") is None

    def test_remove_nonexistent_schedule(self):
        """Removing a non-existent schedule should not raise."""
        remove_schedule(99999)

    def test_get_all_schedules_returns_list(self):
        """get_all_schedules should return a list of dicts with expected fields."""
        add_schedule(profile_id=9004, interval_hours=8)

        # Mock the scheduler's get_jobs to return jobs with next_run_time set
        scheduler = get_scheduler()
        job = scheduler.get_job("search_profile_9004")

        mock_job = MagicMock()
        mock_job.id = job.id
        mock_job.name = job.name
        mock_job.trigger = job.trigger
        mock_job.next_run_time = None  # Not started, so no next_run_time

        with patch.object(scheduler, "get_jobs", return_value=[mock_job]):
            schedules = get_all_schedules()
            assert isinstance(schedules, list)
            assert len(schedules) == 1
            assert schedules[0]["id"] == "search_profile_9004"
            assert "name" in schedules[0]
            assert "trigger" in schedules[0]
            assert "next_run" in schedules[0]

        remove_schedule(9004)

    def test_schedule_info_contains_trigger_string(self):
        """Schedule trigger should be serialized to a string."""
        add_schedule(profile_id=9006, interval_hours=24)

        scheduler = get_scheduler()
        job = scheduler.get_job("search_profile_9006")

        mock_job = MagicMock()
        mock_job.id = job.id
        mock_job.name = job.name
        mock_job.trigger = job.trigger
        mock_job.next_run_time = None

        with patch.object(scheduler, "get_jobs", return_value=[mock_job]):
            schedules = get_all_schedules()
            job_info = schedules[0]
            assert isinstance(job_info["trigger"], str)
            assert "interval" in job_info["trigger"]
            assert "1 day" in job_info["trigger"]  # 24h = 1 day

        remove_schedule(9006)
