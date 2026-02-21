from sqlalchemy import Column, Integer, String, Boolean, Float, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.db.base import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    search_profile_id = Column(Integer, ForeignKey("search_profiles.id"), nullable=True, index=True)
    title = Column(String, index=True)
    company = Column(String, index=True)
    description = Column(Text)
    location = Column(String, index=True)
    url = Column(String, index=True)
    jobroom_url = Column(String, nullable=True)
    application_email = Column(String, nullable=True)
    workload = Column(String)
    publication_date = Column(DateTime(timezone=True))
    
    # Platform Tracking
    platform = Column(String, index=True, nullable=True)
    platform_job_id = Column(String, index=True, nullable=True)
    
    # Metadata
    is_scraped = Column(Boolean, default=False)
    source_query = Column(String)
    
    # AI Analysis
    affinity_score = Column(Float)
    affinity_analysis = Column(Text)
    worth_applying = Column(Boolean, default=False)
    
    # Distance from search origin (km)
    distance_km = Column(Float, nullable=True)
    
    # User Action
    applied = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="jobs")
    search_profile = relationship("SearchProfile", backref="jobs")
