from typing import List, Optional
from sqlalchemy.orm import Session
from backend.repositories.base import BaseRepository
from backend.models import Job

class JobRepository(BaseRepository[Job]):
    def __init__(self, db: Session):
        super().__init__(Job, db)

    def get_by_url(self, url: str) -> Optional[Job]:
        return self.db.query(self.model).filter(self.model.url == url).first()
    
    def get_by_user(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Job]:
        return self.db.query(self.model).filter(self.model.user_id == user_id).offset(skip).limit(limit).all()
