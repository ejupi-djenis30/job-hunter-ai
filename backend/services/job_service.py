from typing import Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException
from backend.repositories.job_repository import JobRepository
from backend.schemas import JobUpdate

class JobService:
    def __init__(self, db: Session):
        self.repo = JobRepository(db)

    def get_jobs_by_user(
        self, user_id: int, page: int, page_size: int,
        filters: Dict[str, Any]
    ) -> Dict[str, Any]:
        skip = (page - 1) * page_size
        
        items = self.repo.get_by_user_filtered(
            user_id, skip=skip, limit=page_size, **filters
        )
        
        # Remove pagination/sorting params before passing to count/stats
        stats_filters = filters.copy()
        stats_filters.pop("sort_by", None)
        stats_filters.pop("sort_order", None)

        total = self.repo.count_by_user_filtered(user_id, **stats_filters)
        stats = self.repo.get_stats_by_user_filtered(user_id, **stats_filters)
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "pages": (total + page_size - 1) // page_size,
            "total_applied": stats["total_applied"],
            "avg_score": stats["avg_score"]
        }

    def create_job(self, user_id: int, job_in: dict):
        job_in["user_id"] = user_id
        if "applied" not in job_in:
            job_in["applied"] = False
        if "is_scraped" not in job_in:
            job_in["is_scraped"] = False
        return self.repo.create(job_in)

    def update_job(self, user_id: int, job_id: int, updates: JobUpdate):
        job = self.repo.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        if job.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        return self.repo.update(job, updates)

def get_job_service(db: Session) -> JobService:
    return JobService(db)
