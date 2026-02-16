from fastapi import APIRouter, Depends, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session

from backend.db.base import get_db
from backend.services.search_service import SearchService
from backend.repositories.job_repository import JobRepository
from backend.repositories.profile_repository import ProfileRepository
from backend.api.deps import get_current_user_id
from backend.services.search_status import get_status

router = APIRouter()

import fitz  # PyMuPDF
import io
import logging

logger = logging.getLogger(__name__)

async def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF bytes using PyMuPDF."""
    text = ""
    try:
        with fitz.open(stream=file_content, filetype="pdf") as doc:
            for page in doc:
                text += page.get_text()
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        # Fallback to simple decode if it's text-based
        try:
            text = file_content.decode("utf-8")
        except:
            text = "Error: Could not extract text from file."
    return text

@router.post("/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id)
):
    content = await file.read()
    if file.filename.lower().endswith(".pdf"):
        text = await extract_text_from_pdf(content)
    else:
        try:
            text = content.decode("utf-8")
        except:
            text = "Error: Only PDF and Text files supported."
    
    return {"text": text, "filename": file.filename}

@router.post("/start")
async def start_search(
    profile_data: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    profile_repo = ProfileRepository(db)
    
    # 1. Save or Update Profile
    # In this app, we typically have one active profile per search or many.
    # Logic: if name exists for user, update. Else create.
    existing = db.query(profile_repo.model).filter(
        profile_repo.model.user_id == user_id,
        profile_repo.model.name == profile_data.get("name", "Default Profile")
    ).first()
    
    if existing:
        profile = profile_repo.update(existing, profile_data)
    else:
        profile_data["user_id"] = user_id
        profile = profile_repo.create(profile_data)
    
    # 2. Trigger Search in Background
    from backend.services.search_service import get_search_service
    service = get_search_service(db)
    
    background_tasks.add_task(service.run_search, profile.id)
    
    return {"message": "Search started", "profile_id": profile.id}


@router.get("/status/{profile_id}")
def get_search_status(
    profile_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """
    Get the current status of a background search for the given profile.
    Returns { "state": "unknown" } if not found.
    """
    return get_status(profile_id)
