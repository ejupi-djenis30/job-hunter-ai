from fastapi import APIRouter, Depends
from typing import Dict, Any

from backend.api.deps import get_current_user_id

router = APIRouter()

@router.get("/status", response_model=Dict[str, Any])
def get_scheduler_status(
    user_id: int = Depends(get_current_user_id)
):
    # Mock status for now, or connect to real scheduler service state
    return {
        "running": True,
        "jobs_scheduled": 0,
        "active_jobs": 0,
        "next_run": None,
        "last_run": None
    }

@router.get("/", response_model=Dict[str, Any])
def list_schedules(
    user_id: int = Depends(get_current_user_id)
):
    # This was likely for debugging or listing all scheduled jobs
    # For now return empty or mock
    return {"schedules": []}
