"""Search & scrape workflow routes."""

import logging

from fastapi import APIRouter, Depends, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import get_db
from backend.services import scraper
from backend.services import scraper
from backend.services.auth_factory import get_current_user
from backend.services.utils import extract_text_from_file
from backend.services.search_status import get_status
from backend.services.scheduler import add_schedule

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Search"])


@router.post("/search/start")
async def start_search(
    profile: schemas.SearchProfileCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Start a background search workflow."""
    logger.info(
        f"Received search request from user {current_user.username} "
        f"for role: {profile.role_description[:50] if profile.role_description else 'N/A'}..."
    )
    try:
        db_profile = models.SearchProfile(
            **profile.model_dump(), user_id=current_user.id
        )
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        logger.info(f"Created profile ID: {db_profile.id}")

        # Register with scheduler if enabled
        if db_profile.schedule_enabled and db_profile.schedule_interval_hours:
            add_schedule(db_profile.id, db_profile.schedule_interval_hours)

        background_tasks.add_task(
            scraper.run_search_workflow, db_profile.id, db, current_user.id
        )

        return {"message": "Search started", "profile_id": db_profile.id}
    except Exception as e:
        logger.error(f"Error in start_search: {e}")
        raise


@router.post("/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    """Extract text from an uploaded CV file (PDF, TXT, MD)."""
    text = await extract_text_from_file(file)
    return {"text": text}


@router.get("/search/status/{profile_id}")
def search_status(
    profile_id: int,
    current_user: models.User = Depends(get_current_user),
):
    """Get live progress of a running search."""
    return get_status(profile_id)
