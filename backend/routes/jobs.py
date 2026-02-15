"""Job CRUD routes."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import get_db
from backend.database import get_db
from backend.services.auth_factory import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("/", response_model=schemas.Job)
def create_job(
    job: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Create a new job record."""
    db_job = models.Job(**job.model_dump(), user_id=current_user.id)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


@router.get("/", response_model=List[schemas.Job])
def read_jobs(
    skip: int = 0,
    limit: int = 100,
    applied: bool = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List jobs for current user with optional filters."""
    query = db.query(models.Job).filter(models.Job.user_id == current_user.id)
    if applied is not None:
        query = query.filter(models.Job.applied == applied)
    return query.offset(skip).limit(limit).all()


@router.patch("/{job_id}", response_model=schemas.Job)
def patch_job(
    job_id: int,
    updates: schemas.JobUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Partial update — toggle applied status, etc."""
    db_job = db.query(models.Job).filter(
        models.Job.id == job_id,
        models.Job.user_id == current_user.id,
    ).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")

    for key, value in updates.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(db_job, key, value)

    db.commit()
    db.refresh(db_job)
    return db_job


@router.put("/{job_id}", response_model=schemas.Job)
def update_job(
    job_id: int,
    job: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Full update of a job record."""
    db_job = db.query(models.Job).filter(
        models.Job.id == job_id,
        models.Job.user_id == current_user.id,
    ).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")

    for key, value in job.model_dump(exclude_unset=True).items():
        setattr(db_job, key, value)

    db.commit()
    db.refresh(db_job)
    return db_job
