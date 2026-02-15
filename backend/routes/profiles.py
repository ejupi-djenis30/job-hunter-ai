"""Search profile & schedule management routes."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import get_db
from backend.database import get_db
from backend.services.auth_factory import get_current_user
from backend.services.scheduler import (
    add_schedule, remove_schedule, get_all_schedules,
)

router = APIRouter(tags=["Profiles"])


@router.get("/profiles/", response_model=List[schemas.SearchProfile])
def list_profiles(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List all search profiles for the current user."""
    return db.query(models.SearchProfile).filter(
        models.SearchProfile.user_id == current_user.id,
    ).all()


@router.patch("/profiles/{profile_id}/schedule")
def toggle_schedule(
    profile_id: int,
    toggle: schemas.ScheduleToggle,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Enable or disable the schedule for a profile."""
    profile = db.query(models.SearchProfile).filter(
        models.SearchProfile.id == profile_id,
        models.SearchProfile.user_id == current_user.id,
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile.schedule_enabled = toggle.enabled
    if toggle.interval_hours is not None:
        profile.schedule_interval_hours = toggle.interval_hours

    db.commit()
    db.refresh(profile)

    if toggle.enabled:
        add_schedule(profile.id, profile.schedule_interval_hours or 24)
    else:
        remove_schedule(profile.id)

    return {
        "message": f"Schedule {'enabled' if toggle.enabled else 'disabled'} for profile {profile_id}",
        "profile_id": profile_id,
        "schedule_enabled": profile.schedule_enabled,
        "schedule_interval_hours": profile.schedule_interval_hours,
    }


@router.delete("/profiles/{profile_id}")
def delete_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete a profile and its schedule."""
    profile = db.query(models.SearchProfile).filter(
        models.SearchProfile.id == profile_id,
        models.SearchProfile.user_id == current_user.id,
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    remove_schedule(profile_id)
    db.delete(profile)
    db.commit()
    return {"message": f"Profile {profile_id} deleted"}


@router.get("/schedules/", response_model=List[schemas.SearchProfile])
def list_scheduled_profiles(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List all profiles with scheduling enabled."""
    return db.query(models.SearchProfile).filter(
        models.SearchProfile.user_id == current_user.id,
        models.SearchProfile.schedule_enabled == True,
    ).all()


@router.get("/schedules/status")
def scheduler_status(current_user: models.User = Depends(get_current_user)):
    """Get current scheduler status and all active jobs."""
    return {"active_jobs": get_all_schedules()}
