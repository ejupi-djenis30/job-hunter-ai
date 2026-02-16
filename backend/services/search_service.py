import logging
import asyncio
from typing import List, Any
from datetime import datetime
from backend.repositories.job_repository import JobRepository
from backend.repositories.profile_repository import ProfileRepository
from backend.services.llm_service import llm_service
from backend.providers.jobs.jobroom.client import JobRoomProvider
from backend.providers.jobs.models import JobSearchRequest, SortOrder
from backend.models import Job
from backend.core.config import settings

logger = logging.getLogger(__name__)

class SearchService:
    def __init__(self, job_repo: JobRepository, profile_repo: ProfileRepository):
        self.job_repo = job_repo
        self.profile_repo = profile_repo

    async def run_search(self, profile_id: int):
        profile = self.profile_repo.get(profile_id)
        if not profile:
            logger.error(f"Profile {profile_id} not found")
            return

        # Generate keywords
        keywords_data = llm_service.generate_search_keywords({
            "role_description": profile.role_description,
            "cv_content": profile.cv_content,
            "location": profile.location_filter,
        })
        
        logger.info(f"Generated {len(keywords_data)} search queries for profile {profile_id}")
        
        async with JobRoomProvider() as provider:
            for query_item in keywords_data:
                keyword = query_item.get("value")
                if not keyword:
                    continue
                
                logger.info(f"Searching for keyword: {keyword}")
                request = JobSearchRequest(
                    query=keyword,
                    location=profile.location_filter or "Zürich",
                    sort=SortOrder.DATE_DESC,
                    posted_within_days=profile.posted_within_days or 30
                )
                
                try:
                    response = await provider.search(request)
                    logger.info(f"Found {len(response.items)} jobs for '{keyword}'")
                    
                    for item in response.items:
                        await self._process_job(item, profile)
                        
                except Exception as e:
                    logger.error(f"Error searching for '{keyword}': {e}")

    async def _process_job(self, job_item: Any, profile: Any):
        # job_item is JobListing (pydantic)
        # Check if exists
        try:
            if not job_item.external_url:
                return

            existing = self.job_repo.get_by_url(job_item.external_url)
            if existing:
                return # Skip if exists
            
            # Create job object
            # Map Pydantic JobListing to DB Job model
            title = job_item.title
            company = job_item.company.name if job_item.company else "Unknown"
            description = job_item.descriptions[0].description if job_item.descriptions else ""
            location = job_item.location.city if job_item.location else "Unknown"
            
            # LLM Analysis
            analysis = llm_service.analyze_job_affinity(
                {"title": title, "description": description, "company": company},
                {"role_description": profile.role_description, "cv_content": profile.cv_content}
            )
            
            new_job = Job(
                user_id=profile.user_id,
                title=title,
                company=company,
                description=description,
                location=location,
                url=job_item.external_url,
                jobroom_url=f"https://www.job-room.ch/job-advertisement/{job_item.id}" if job_item.source == "job_room" else None,
                publication_date=job_item.publication_date,
                is_scraped=True,
                source_query=job_item.request.query if hasattr(job_item, 'request') else "auto",
                affinity_score=analysis.get("affinity_score"),
                affinity_analysis=analysis.get("affinity_analysis"),
                worth_applying=analysis.get("worth_applying", False)
            )
            
            self.job_repo.create(new_job)
            logger.info(f"Saved new job: {title} at {company}")
            
        except Exception as e:
            logger.error(f"Error processing job {job_item.title}: {e}")

# Factory or singleton
def get_search_service(db) -> SearchService:
    from backend.repositories.job_repository import JobRepository
    from backend.repositories.profile_repository import ProfileRepository
    return SearchService(JobRepository(db), ProfileRepository(db))
