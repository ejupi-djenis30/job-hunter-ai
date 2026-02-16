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
        return q.count()
