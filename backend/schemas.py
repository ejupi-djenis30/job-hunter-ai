from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


# ═══════════════════════════════════════
# Auth Schemas
# ═══════════════════════════════════════

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


# ═══════════════════════════════════════
# Job Schemas
# ═══════════════════════════════════════

class JobBase(BaseModel):
    title: str
    company: str
    description: Optional[str] = None
    location: Optional[str] = None
    url: str
    jobroom_url: Optional[str] = None
    application_email: Optional[str] = None
    workload: Optional[str] = None
    publication_date: Optional[datetime] = None

class JobCreate(JobBase):
    is_scraped: bool = False
    source_query: Optional[str] = None
    affinity_score: Optional[float] = None
    affinity_analysis: Optional[str] = None
    worth_applying: Optional[bool] = False
    distance_km: Optional[float] = None

class JobUpdate(BaseModel):
    """Partial update schema — all fields optional."""
    applied: Optional[bool] = None
    title: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None

class Job(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_scraped: bool
    source_query: Optional[str] = None
    affinity_score: Optional[float] = None
    affinity_analysis: Optional[str] = None
    worth_applying: Optional[bool] = False
    distance_km: Optional[float] = None
    applied: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

class JobPaginationResponse(BaseModel):
    items: List[Job]
    total: int
    page: int
    pages: int


# ═══════════════════════════════════════
# Search Profile Schemas
# ═══════════════════════════════════════

class SearchProfileBase(BaseModel):
    name: str = "Default Profile"
    cv_content: Optional[str] = None
    role_description: Optional[str] = None
    search_strategy: Optional[str] = None
    location_filter: Optional[str] = None
    workload_filter: Optional[str] = None
    posted_within_days: Optional[int] = 30
    max_distance: Optional[int] = 50
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    scrape_mode: Optional[str] = "sequential"
    max_queries: Optional[int] = None
    is_history: Optional[bool] = False
    is_stopped: Optional[bool] = False
    # Schedule
    schedule_enabled: Optional[bool] = False
    schedule_interval_hours: Optional[int] = 24

class SearchProfileCreate(SearchProfileBase):
    pass

class SearchProfile(SearchProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    last_scheduled_run: Optional[datetime] = None
    created_at: datetime

class ScheduleToggle(BaseModel):
    """Toggle schedule on/off for a profile."""
    enabled: bool
    interval_hours: Optional[int] = None
