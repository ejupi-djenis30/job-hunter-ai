from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.db.base import get_db
from backend.repositories.profile_repository import ProfileRepository
from backend.api.deps import get_current_user_id
from backend.models import SearchProfile as ProfileModel
from backend.schemas import SearchProfile, SearchProfileCreate, ScheduleToggle # Make sure schemas exist or assume they do
# If schemas are missing, will fail. I saw `SearchProfile` (schema) in Step 341.

router = APIRouter()

@router.get("/", response_model=List[SearchProfile])
def read_profiles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    repo = ProfileRepository(db)
    return repo.get_by_user(user_id, skip=skip, limit=limit)

@router.post("/", response_model=SearchProfile)
def create_profile(
    profile_in: SearchProfileCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    repo = ProfileRepository(db)
    data = profile_in.model_dump()
    data["user_id"] = user_id
    return repo.create(data)

@router.delete("/{profile_id}")
def delete_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    repo = ProfileRepository(db)
    profile = repo.get(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    repo.delete(profile_id)
    return {"message": "Profile deleted"}

@router.patch("/{profile_id}/schedule", response_model=SearchProfile)
def toggle_schedule(
    profile_id: int,
    schedule: ScheduleToggle,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    repo = ProfileRepository(db)
    profile = repo.get(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {"schedule_enabled": schedule.enabled}
    if schedule.interval_hours:
        update_data["schedule_interval_hours"] = schedule.interval_hours
        
    return repo.update(profile, update_data)
