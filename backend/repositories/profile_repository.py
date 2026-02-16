from typing import List
from sqlalchemy.orm import Session
from backend.repositories.base import BaseRepository
from backend.models import SearchProfile

class ProfileRepository(BaseRepository[SearchProfile]):
    def __init__(self, db: Session):
        super().__init__(SearchProfile, db)

    def get_by_user(self, user_id: int, skip: int = 0, limit: int = 100) -> List[SearchProfile]:
        return self.db.query(self.model).filter(self.model.user_id == user_id).offset(skip).limit(limit).all()
