from fastapi import APIRouter, Depends
from typing import Dict, Any, List

from backend.api.deps import get_current_user_id
from backend.services.scheduler import get_scheduler, get_all_schedules

router = APIRouter()


@router.get("/status", response_model=Dict[str, Any])
def get_scheduler_status(
    user_id: int = Depends(get_current_user_id),
):
    """Return the current scheduler status."""
    scheduler = get_scheduler()
    return {
        "running": scheduler.running if scheduler else False,
        "jobs_scheduled": len(scheduler.get_jobs()) if scheduler and scheduler.running else 0,
    }


@router.get("/", response_model=List[Dict[str, Any]])
def list_schedules(
    user_id: int = Depends(get_current_user_id),
):
    """List all scheduled search jobs."""
    return get_all_schedules()
