from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

load_dotenv()

from backend import models, schemas, database
from backend.services import scraper, llm
from backend.services.utils import extract_text_from_file
from backend.services.search_status import get_status
from backend.services.scheduler import start_scheduler, stop_scheduler, add_schedule, remove_schedule, get_all_schedules
from backend.services.auth import (
    hash_password, verify_password, create_access_token, get_current_user
)

models.Base.metadata.create_all(bind=database.engine)

# Lifecycle: start/stop scheduler
@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()

app = FastAPI(title="Job Hunter AI", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ═══════════════════════════════════════
# Auth Endpoints (no auth required)
# ═══════════════════════════════════════

@app.get("/")
def read_root():
    return {"message": "Job Hunter AI Backend is running"}


@app.post("/auth/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    db_user = models.User(
        username=user.username,
        hashed_password=hash_password(user.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    token = create_access_token(db_user.id, db_user.username)
    return {"access_token": token, "token_type": "bearer", "username": db_user.username}


@app.post("/auth/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login and get JWT token."""
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = create_access_token(db_user.id, db_user.username)
    return {"access_token": token, "token_type": "bearer", "username": db_user.username}


# ═══════════════════════════════════════
# Job Endpoints (auth required)
# ═══════════════════════════════════════

@app.post("/jobs/", response_model=schemas.Job)
def create_job(
    job: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_job = models.Job(**job.dict(), user_id=current_user.id)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@app.get("/jobs/", response_model=List[schemas.Job])
def read_jobs(
    skip: int = 0,
    limit: int = 100,
    applied: bool = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Job).filter(models.Job.user_id == current_user.id)
    if applied is not None:
        query = query.filter(models.Job.applied == applied)
    return query.offset(skip).limit(limit).all()

@app.patch("/jobs/{job_id}", response_model=schemas.Job)
def patch_job(
    job_id: int,
    updates: schemas.JobUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Partial update - used for toggling applied status etc."""
    db_job = db.query(models.Job).filter(
        models.Job.id == job_id,
        models.Job.user_id == current_user.id,
    ).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    update_data = updates.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(db_job, key, value)
    
    db.commit()
    db.refresh(db_job)
    return db_job

@app.put("/jobs/{job_id}", response_model=schemas.Job)
def update_job(
    job_id: int,
    job: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_job = db.query(models.Job).filter(
        models.Job.id == job_id,
        models.Job.user_id == current_user.id,
    ).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    for key, value in job.dict(exclude_unset=True).items():
        setattr(db_job, key, value)
    
    db.commit()
    db.refresh(db_job)
    return db_job


# ═══════════════════════════════════════
# Search Endpoints (auth required)
# ═══════════════════════════════════════

@app.post("/search/start")
async def start_search(
    profile: schemas.SearchProfileCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    logger.info(f"Received search request from user {current_user.username} for role: {profile.role_description[:50]}...")
    try:
        db_profile = models.SearchProfile(**profile.dict(), user_id=current_user.id)
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        logger.info(f"Created profile ID: {db_profile.id}")
        
        # If schedule is enabled, register with scheduler
        if db_profile.schedule_enabled and db_profile.schedule_interval_hours:
            add_schedule(db_profile.id, db_profile.schedule_interval_hours)
        
        background_tasks.add_task(
            scraper.run_search_workflow, db_profile.id, db, current_user.id
        )
        
        return {"message": "Search started", "profile_id": db_profile.id}
    except Exception as e:
        logger.error(f"Error in start_search: {e}")
        raise e

@app.post("/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    text = await extract_text_from_file(file)
    return {"text": text}

@app.get("/search/status/{profile_id}")
def search_status(
    profile_id: int,
    current_user: models.User = Depends(get_current_user),
):
    """Get live progress of a running search."""
    return get_status(profile_id)


# ═══════════════════════════════════════
# Schedule Management Endpoints
# ═══════════════════════════════════════

@app.get("/schedules/", response_model=List[schemas.SearchProfile])
def list_scheduled_profiles(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List all profiles that have scheduling enabled."""
    return db.query(models.SearchProfile).filter(
        models.SearchProfile.user_id == current_user.id,
        models.SearchProfile.schedule_enabled == True,
    ).all()

@app.get("/profiles/", response_model=List[schemas.SearchProfile])
def list_profiles(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List all search profiles."""
    return db.query(models.SearchProfile).filter(
        models.SearchProfile.user_id == current_user.id,
    ).all()

@app.patch("/profiles/{profile_id}/schedule")
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

@app.delete("/profiles/{profile_id}")
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

@app.get("/schedules/status")
def scheduler_status(current_user: models.User = Depends(get_current_user)):
    """Get current scheduler status and all active jobs."""
    return {
        "active_jobs": get_all_schedules(),
    }
