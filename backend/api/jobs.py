from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.db.base import get_db
from backend.repositories.job_repository import JobRepository
from backend.api.deps import get_current_user_id
from backend.schemas import Job, JobUpdate, JobPaginationResponse

router = APIRouter()


@router.get("/", response_model=JobPaginationResponse)
def read_jobs(
    # ── Filters ──
    applied: Optional[bool] = None,
    worth_applying: Optional[bool] = None,
    min_score: Optional[float] = Query(None, ge=0, le=100),
    max_score: Optional[float] = Query(None, ge=0, le=100),
    min_distance: Optional[float] = Query(None, ge=0),
    max_distance: Optional[float] = Query(None, ge=0),
    # ── Sorting ──
    sort_by: str = Query("created_at", pattern="^(created_at|affinity_score|distance_km|title|publication_date)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    # ── Pagination ──
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    # ── Auth & DB ──
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    repo = JobRepository(db)
    skip = (page - 1) * page_size
    
    items = repo.get_by_user_filtered(
        user_id,
        min_score=min_score,
        max_score=max_score,
        min_distance=min_distance,
        max_distance=max_distance,
        worth_applying=worth_applying,
        applied=applied,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip,
        limit=page_size,
    )
    
    total = repo.count_by_user_filtered(
        user_id,
        min_score=min_score,
        max_score=max_score,
        min_distance=min_distance,
        max_distance=max_distance,
        worth_applying=worth_applying,
        applied=applied,
    )
    
    stats = repo.get_stats_by_user_filtered(
        user_id,
        min_score=min_score,
        max_score=max_score,
        min_distance=min_distance,
        max_distance=max_distance,
        worth_applying=worth_applying,
        applied=applied,
    )
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": (total + page_size - 1) // page_size,
        "total_applied": stats["total_applied"],
        "avg_score": stats["avg_score"]
    }


@router.post("/", response_model=Job)
def create_job(
    job_in: dict,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    repo = JobRepository(db)
    job_in["user_id"] = user_id
    if "applied" not in job_in:
        job_in["applied"] = False
    if "is_scraped" not in job_in:
        job_in["is_scraped"] = False
    return repo.create(job_in)


@router.patch("/{job_id}", response_model=Job)
def update_job(
    job_id: int,
    updates: JobUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    repo = JobRepository(db)
    job = repo.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return repo.update(job, updates)
