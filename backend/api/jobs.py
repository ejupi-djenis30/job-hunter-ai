from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.db.base import get_db
from backend.repositories.job_repository import JobRepository
from backend.api.deps import get_current_user_id
from backend.schemas import Job

router = APIRouter()

@router.get("/", response_model=List[Job])
def read_jobs(
    applied: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    repo = JobRepository(db)
    # Filter by user_id
    jobs = repo.get_by_user(user_id, skip=skip, limit=limit)
    
    # Simple in-memory filter for 'applied' if not in repo (or add to repo)
    if applied is not None:
        jobs = [j for j in jobs if j.applied == applied]
        
    return jobs

@router.post("/", response_model=Job)
def create_job(
    job_in: dict,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    repo = JobRepository(db)
    # Ensure user_id is set
    job_in["user_id"] = user_id
    if "applied" not in job_in:
        job_in["applied"] = False
    if "is_scraped" not in job_in:
        job_in["is_scraped"] = False
        
    return repo.create(job_in)

@router.patch("/{job_id}", response_model=Job)
def update_job(
    job_id: int,
    updates: dict,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    repo = JobRepository(db)
    job = repo.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return repo.update(job, updates)
