import logging
from datetime import datetime

from fastapi import APIRouter, Depends, BackgroundTasks, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from backend.db.base import get_db
from backend.repositories.profile_repository import ProfileRepository
from backend.api.deps import get_current_user_id
from backend.services.search_status import get_status
from backend.services.utils import extract_text_from_file

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
):
    text = await extract_text_from_file(file)
    return {"text": text, "filename": file.filename}


@router.post("/start")
async def start_search(
    profile_data: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    profile_repo = ProfileRepository(db)

    # If it's a manual search from the form (no ID or explicit history flag)
    # create a new History entry.
    # Otherwise if it has an ID, use that (re-run).
    # Sanitize profile_data: convert empty strings to None for numeric fields
    numeric_fields = ["max_queries", "posted_within_days", "max_distance", "schedule_interval_hours"]
    for field in numeric_fields:
        if profile_data.get(field) == "":
            profile_data[field] = None

    profile_id = profile_data.get("id")
    
    if profile_id:
        profile = profile_repo.get(profile_id)
        if not profile or profile.user_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized profile access")
        # Update existing if needed (e.g. if settings changed before re-run)
        profile = profile_repo.update(profile, profile_data)
    else:
        # New manual search -> create history entry
        profile_data["user_id"] = user_id
        profile_data["is_history"] = True
        # If it doesn't have a name, give it a timestamped one
        if not profile_data.get("name") or profile_data["name"] == "Default Profile":
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
            profile_data["name"] = f"Search {timestamp}"
            
        profile = profile_repo.create(profile_data)

    # Trigger search in background
    from backend.services.search_service import get_search_service

    service = get_search_service(db)
    background_tasks.add_task(service.run_search, profile.id)

    return {"message": "Search started", "profile_id": profile.id}


@router.get("/status/{profile_id}")
def get_search_status(
    profile_id: int,
    user_id: int = Depends(get_current_user_id),
):
    """Get the current status of a background search for the given profile."""
    return get_status(profile_id)
