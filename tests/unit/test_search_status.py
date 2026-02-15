"""Unit tests for search status tracker."""

from backend.services.search_status import (
    init_status, add_log, update_status, get_status, clear_status,
)


class TestSearchStatus:
    """Test in-memory search status tracking."""

    def test_init_status(self):
        """Should initialize a new search status."""
        init_status(999, total_searches=3, searches=[
            {"query": "python"},
            {"query": "fastapi"},
            {"query": "backend"},
        ])
        status = get_status(999)
        assert status["state"] == "generating"
        assert status["total_searches"] == 3
        assert len(status["searches_generated"]) == 3
        clear_status(999)

    def test_add_log(self):
        """Should add timestamped log entries."""
        init_status(998, total_searches=1, searches=[{"query": "test"}])
        add_log(998, "Starting search...")
        add_log(998, "Found 10 jobs")

        status = get_status(998)
        assert len(status["log"]) == 2
        assert status["log"][0]["message"] == "Starting search..."
        assert "time" in status["log"][0]
        clear_status(998)

    def test_update_status(self):
        """Should update arbitrary status fields."""
        init_status(997, total_searches=1, searches=[])
        update_status(997, state="done", jobs_found=42)

        status = get_status(997)
        assert status["state"] == "done"
        assert status["jobs_found"] == 42
        clear_status(997)

    def test_unknown_profile(self):
        """Should return unknown state for untracked profile."""
        status = get_status(99999)
        assert status["state"] == "unknown"

    def test_clear_status(self):
        """Should remove status after clearing."""
        init_status(996, total_searches=1, searches=[])
        clear_status(996)
        status = get_status(996)
        assert status["state"] == "unknown"
