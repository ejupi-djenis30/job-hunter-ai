"""
In-memory search status tracker.
Stores real-time progress of search workflows for frontend polling.
"""
from datetime import datetime, timezone
from typing import Dict, List, Any
import threading

_lock = threading.Lock()
_statuses: Dict[int, Dict[str, Any]] = {}


def init_status(profile_id: int, total_searches: int = 0, searches: List[Dict] = None):
    """Initialize or reset status when search begins."""
    with _lock:
        _statuses[profile_id] = {
            "state": "generating",
            "total_searches": total_searches,
            "current_search_index": 0,
            "current_query": "",
            "searches_generated": searches or [],
            "jobs_found": 0,
            "jobs_new": 0,
            "jobs_duplicates": 0,
            "jobs_skipped": 0,
            "errors": 0,
            "log": [],
            "started_at": datetime.now(timezone.utc).isoformat(),
            "finished_at": None,
        }


def add_log(profile_id: int, message: str):
    """Append a log entry."""
    with _lock:
        s = _statuses.get(profile_id)
        if s:
            s["log"].append({
                "time": datetime.now(timezone.utc).isoformat(),
                "message": message,
            })
            # Keep last 100 entries
            if len(s["log"]) > 100:
                s["log"] = s["log"][-100:]


def update_status(profile_id: int, **kwargs):
    """Update any status fields."""
    with _lock:
        s = _statuses.get(profile_id)
        if s:
            s.update(kwargs)


def get_status(profile_id: int) -> Dict[str, Any]:
    """Get current status for a profile."""
    with _lock:
        return dict(_statuses.get(profile_id, {"state": "unknown"}))


def clear_status(profile_id: int):
    """Remove status (optional cleanup)."""
    with _lock:
        _statuses.pop(profile_id, None)
