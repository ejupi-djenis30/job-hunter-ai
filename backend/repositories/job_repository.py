from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from backend.repositories.base import BaseRepository
from backend.models import Job


class JobRepository(BaseRepository[Job]):
    def __init__(self, db: Session):
        super().__init__(Job, db)

    def get_by_url(self, url: str) -> Optional[Job]:
        return self.db.query(self.model).filter(self.model.url == url).first()

    def get_by_user(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Job]:
        return (
            self.db.query(self.model)
            .filter(self.model.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def _build_filter_query(
        self,
        user_id: int,
        *,
        min_score: Optional[float] = None,
        max_score: Optional[float] = None,
        min_distance: Optional[float] = None,
        max_distance: Optional[float] = None,
        worth_applying: Optional[bool] = None,
        applied: Optional[bool] = None,
    ):
        q = self.db.query(self.model).filter(self.model.user_id == user_id)

        if min_score is not None:
            q = q.filter(self.model.affinity_score >= min_score)
        if max_score is not None:
            q = q.filter(self.model.affinity_score <= max_score)
        if min_distance is not None:
            q = q.filter(self.model.distance_km >= min_distance)
        if max_distance is not None:
            q = q.filter(self.model.distance_km <= max_distance)
        if worth_applying is not None:
            q = q.filter(self.model.worth_applying == worth_applying)
        if applied is not None:
            q = q.filter(self.model.applied == applied)
        return q

    def get_by_user_filtered(
        self,
        user_id: int,
        *,
        min_score: Optional[float] = None,
        max_score: Optional[float] = None,
        min_distance: Optional[float] = None,
        max_distance: Optional[float] = None,
        worth_applying: Optional[bool] = None,
        applied: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 200,
    ) -> List[Job]:
        """Return jobs for a user with optional server-side filters."""
        q = self._build_filter_query(
            user_id,
            min_score=min_score,
            max_score=max_score,
            min_distance=min_distance,
            max_distance=max_distance,
            worth_applying=worth_applying,
            applied=applied,
        )

        # Sorting
        allowed_sort = {
            "created_at": self.model.created_at,
            "affinity_score": self.model.affinity_score,
            "distance_km": self.model.distance_km,
            "title": self.model.title,
            "publication_date": self.model.publication_date,
        }
        col = allowed_sort.get(sort_by, self.model.created_at)
        order_fn = desc if sort_order == "desc" else asc
        q = q.order_by(order_fn(col))

        return q.offset(skip).limit(limit).all()

    def count_by_user_filtered(
        self,
        user_id: int,
        *,
        min_score: Optional[float] = None,
        max_score: Optional[float] = None,
        min_distance: Optional[float] = None,
        max_distance: Optional[float] = None,
        worth_applying: Optional[bool] = None,
        applied: Optional[bool] = None,
    ) -> int:
        q = self._build_filter_query(
            user_id,
            min_score=min_score,
            max_score=max_score,
            min_distance=min_distance,
            max_distance=max_distance,
            worth_applying=worth_applying,
            applied=applied,
        )
        return q.count()

    def get_stats_by_user_filtered(
        self,
        user_id: int,
        *,
        min_score: Optional[float] = None,
        max_score: Optional[float] = None,
        min_distance: Optional[float] = None,
        max_distance: Optional[float] = None,
        worth_applying: Optional[bool] = None,
        applied: Optional[bool] = None,
    ) -> dict:
        """Get aggregate stats for filtered jobs."""
        from sqlalchemy import func
        
        # We need to compute stats on the filtered set
        # But wait, logic check: 'applied' filter in the main query might hide applied jobs if applied=False is passed.
        # The user wants "Total Jobs" (matching current filters), "Avg Match" (matching current filters), 
        # but "Applied" usually implies "How many of these are applied".
        
        # If I filter applied=False, then applied count is 0. That is technically correct for the view.
        # So we use the same base query.
        
        q = self._build_filter_query(
            user_id,
            min_score=min_score,
            max_score=max_score,
            min_distance=min_distance,
            max_distance=max_distance,
            worth_applying=worth_applying,
            applied=applied,
        )
        
        # We need: count of applied=True within this set
        # And avg of affinity_score within this set
        
        stats = q.with_entities(
            func.count(self.model.id).filter(self.model.applied == True),
            func.avg(self.model.affinity_score)
        ).first()
        
        applied_count = stats[0] if stats and stats[0] else 0
        avg_score = stats[1] if stats and stats[1] else 0.0
        
        return {
            "total_applied": applied_count,
            "avg_score": float(avg_score)
        }
