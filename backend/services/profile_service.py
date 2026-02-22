from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException
from backend.repositories.profile_repository import ProfileRepository
from backend.schemas import SearchProfileCreate, ScheduleToggle

class ProfileService:
    def __init__(self, db: Session):
        self.repo = ProfileRepository(db)

    def get_profiles_by_user(self, user_id: int, skip: int = 0, limit: int = 100):
        return self.repo.get_by_user(user_id, skip=skip, limit=limit)

    def create_profile(self, user_id: int, profile_in: SearchProfileCreate):
        data = profile_in.model_dump()
        data["user_id"] = user_id
        return self.repo.create(data)

    def delete_profile(self, user_id: int, profile_id: int):
        profile = self.repo.get(profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        if profile.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        self.repo.delete(profile_id)
        return {"message": "Profile deleted"}

    def update_profile(self, user_id: int, profile_id: int, profile_in: "SearchProfileUpdate"):
        profile = self.repo.get(profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        if profile.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        return self.repo.update(profile, profile_in)

    def toggle_schedule(self, user_id: int, profile_id: int, schedule: ScheduleToggle):
        profile = self.repo.get(profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        if profile.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        update_data = {"schedule_enabled": schedule.enabled}
        if schedule.interval_hours:
            update_data["schedule_interval_hours"] = schedule.interval_hours
            
        return self.repo.update(profile, update_data)

def get_profile_service(db: Session) -> ProfileService:
    return ProfileService(db)
