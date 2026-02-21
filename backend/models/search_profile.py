from sqlalchemy import Column, Integer, String, Boolean, Float, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.db.base import Base


class SearchProfile(Base):
    __tablename__ = "search_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, default="Default Profile")
    cv_content = Column(Text)
    
    # Preferences
    role_description = Column(Text)
    search_strategy = Column(Text)
    
    # Filters
    location_filter = Column(String)
    workload_filter = Column(String)
    posted_within_days = Column(Integer, default=30)
    max_distance = Column(Integer, default=50)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    scrape_mode = Column(String, default="sequential")
    max_queries = Column(Integer, nullable=True)
    is_history = Column(Boolean, default=False)
    is_stopped = Column(Boolean, default=False)
    
    # Schedule
    schedule_enabled = Column(Boolean, default=False)
    schedule_interval_hours = Column(Integer, default=24)
    last_scheduled_run = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="profiles")
