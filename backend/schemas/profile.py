from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

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
