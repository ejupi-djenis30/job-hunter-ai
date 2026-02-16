import logging

from fastapi import APIRouter, Depends, BackgroundTasks, UploadFile, File
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

    # Save or update profile: match by name for the user
    existing = db.query(profile_repo.model).filter(
        profile_repo.model.user_id == user_id,
        profile_repo.model.name == profile_data.get("name", "Default Profile"),
    ).first()

    if existing:
        profile = profile_repo.update(existing, profile_data)
    else:
        profile_data["user_id"] = user_id
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
