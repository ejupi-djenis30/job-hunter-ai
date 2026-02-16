from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from backend.db.base import get_db
from backend.services.search_service import SearchService
from backend.repositories.job_repository import JobRepository
from backend.repositories.profile_repository import ProfileRepository
from backend.api.deps import get_current_user_id

router = APIRouter()

@router.post("/start")
async def start_search(
    profile_data: dict, # Should use Pydantic model
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    # In a real app we'd create/update the profile here first
    # For now, assuming profile logic is handled or we just trigger based on ID
    # This is a simplification during refactor to get structure right
    
    # Create temp profile or use existing
    profile_repo = ProfileRepository(db)
    job_repo = JobRepository(db)
    service = SearchService(job_repo, profile_repo)
    
    # Ideally, we pass the profile_id. 
    # If the frontend sends the full profile, we might need to save it first.
    
    return {"message": "Search started (mock)"}

@router.get("/status/{profile_id}")
def get_status(profile_id: int):
    # Status logic needs to be migrated to a proper service/store
    # Currently it was in-memory in `backend.services.search_status`
    # We should keep using that for now or move it to redis/db
    from backend.services.search_status import get_status
    return get_status(profile_id)

from fastapi import UploadFile, File

@router.post("/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id)
):
    # Process CV logic here (extract text)
    # For now just return mock success or text
    content = await file.read()
    return {"filename": file.filename, "content_preview": content[:100].decode("utf-8", errors="ignore")}
