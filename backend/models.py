from sqlalchemy import Column, Integer, String, Boolean, Float, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    jobs = relationship("Job", back_populates="user")
    profiles = relationship("SearchProfile", back_populates="user")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, index=True)
    company = Column(String, index=True)
    description = Column(Text)
    location = Column(String, index=True)
    url = Column(String, index=True)
    jobroom_url = Column(String, nullable=True)
    application_email = Column(String, nullable=True)
    workload = Column(String)
    publication_date = Column(DateTime(timezone=True))
    
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
    
    # Schedule
    schedule_enabled = Column(Boolean, default=False)
    schedule_interval_hours = Column(Integer, default=24)
    last_scheduled_run = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="profiles")
