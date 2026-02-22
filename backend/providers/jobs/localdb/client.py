import logging
from typing import AsyncGenerator
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.providers.jobs.base import JobProvider
from backend.providers.jobs.models import (
    JobSearchRequest,
    JobListing,
    ProviderInfo,
    JobLocation,
    EmploymentDetails
)
from backend.services.utils import haversine_distance
from backend.models import ScrapedJob

logger = logging.getLogger(__name__)

class LocalDbProvider(JobProvider):
    def __init__(self, db: Session):
        self.db = db

    def name(self) -> str:
        return "local_db"

    def get_provider_info(self) -> ProviderInfo:
        return ProviderInfo(
            name="local_db",
            description="Searches the application database for previously scraped jobs.",
            domain="internal",
        )

    def _db_job_to_listing(self, db_job: ScrapedJob, distance_km: float = None) -> JobListing:
        # Reconstruct EmploymentInfo
        employment = None
        if db_job.workload:
            # Typical format "80-100%" or "100%"
            w_str = db_job.workload.replace("%", "").strip()
            if "-" in w_str:
                parts = w_str.split("-")
                employment = EmploymentDetails(
                    workload_min=int(parts[0]),
                    workload_max=int(parts[1])
                )
            elif w_str.isdigit():
                employment = EmploymentDetails(
                    workload_min=int(w_str),
                    workload_max=int(w_str)
                )

        location = None
        if db_job.location:
            location = JobLocation(city=db_job.location)
            
        return JobListing(
            id=db_job.platform_job_id,
            title=db_job.title,
            company={"name": db_job.company} if db_job.company else None,
            source=db_job.platform,
            location=location,
            employment=employment,
            external_url=db_job.external_url,
            raw_data=db_job.raw_metadata or {},
        )

    async def search(self, request: JobSearchRequest) -> AsyncGenerator[JobListing, None]:
        logger.info(f"[{self.name()}] Starting search for '{request.query}' in '{request.location}'")

        # Start building the ORM query
        q = self.db.query(ScrapedJob)
        
        # 1. Keywords filtering (ILIKE)
        if request.query:
            query_terms = request.query.split(" ")
            for term in query_terms:
                term = term.strip()
                if not term:
                    continue
                ilike_term = f"%{term}%"
                q = q.filter(
                    or_(
                        ScrapedJob.title.ilike(ilike_term),
                        ScrapedJob.description.ilike(ilike_term),
                        ScrapedJob.company.ilike(ilike_term)
                    )
                )

        # 2. Location filtering
        if request.location:
            # We can only perform exact or fuzzy match on the string since we don't store lat/lon explicitly in ScrapedJob right now
            ilike_city = f"%{request.location}%"
            q = q.filter(ScrapedJob.location.ilike(ilike_city))

        # 3. Pagination (Local limit)
        q = q.limit(request.page_size)

        scraped_jobs = q.all()

        count = 0
        for db_job in scraped_jobs:
            yield self._db_job_to_listing(db_job)
            count += 1

        logger.info(f"[{self.name()}] Found {count} internal jobs")
