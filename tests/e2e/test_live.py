"""
End-to-end live tests for the scraper.

These tests hit the real job-room.ch API and require --run-live flag.
They are designed to verify the scraper works against the live API.

Usage:
    pytest tests/e2e/test_live.py --run-live -v
"""

import pytest

from backend.scraper.core.models import JobSearchRequest
from backend.scraper.providers.job_room.client import JobRoomProvider


@pytest.mark.live
@pytest.mark.asyncio
async def test_live_search():
    """Search for jobs on the live job-room.ch API."""
    async with JobRoomProvider() as provider:
        response = await provider.search(
            JobSearchRequest(
                query="Software Engineer",
                location="Zürich",
                page_size=5,
            )
        )

        assert response.total_count > 0
        assert len(response.items) > 0
        assert response.source == "job_room"

        # Verify first job has required fields
        job = response.items[0]
        assert job.id
        assert job.title
        assert job.company is not None


@pytest.mark.live
@pytest.mark.asyncio
async def test_live_health_check():
    """Verify job-room.ch is accessible."""
    async with JobRoomProvider() as provider:
        health = await provider.health_check()
        assert health.status.value in ("healthy", "degraded")
        assert health.latency_ms is not None
