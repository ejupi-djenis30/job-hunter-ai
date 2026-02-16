import logging
import asyncio
from typing import List, Any
from datetime import datetime
from backend.repositories.job_repository import JobRepository
from backend.repositories.profile_repository import ProfileRepository
from backend.services.llm_service import llm_service
from backend.services.utils import haversine_distance
from backend.providers.jobs.jobroom.client import JobRoomProvider
from backend.providers.jobs.models import JobSearchRequest, SortOrder
from backend.models import Job
from backend.core.config import settings
from backend.services.search_status import (
    init_status, add_log, update_status, clear_status,
)

logger = logging.getLogger(__name__)


class SearchService:
    def __init__(self, job_repo: JobRepository, profile_repo: ProfileRepository):
        self.job_repo = job_repo
        self.profile_repo = profile_repo

    # ───────────────────────── public entry point ─────────────────────────

    async def run_search(self, profile_id: int):
        """Run the full search workflow for a saved profile."""
        profile = self.profile_repo.get(profile_id)
        if not profile:
            logger.error(f"Profile {profile_id} not found")
            return

        profile_dict = {
            "cv_content": profile.cv_content or "",
            "role_description": profile.role_description or "",
            "search_strategy": profile.search_strategy or "",
        }

        # Initialize status tracker immediately so frontend sees progress
        init_status(profile_id)

        # ── Step 1: Generate keywords using LLM (run in thread to avoid blocking) ──
        add_log(profile_id, "Generating search keywords with AI…")

        try:
            searches = await asyncio.to_thread(
                llm_service.generate_search_keywords, profile_dict
            )
        except Exception as e:
            logger.error(f"LLM keyword generation failed: {e}")
            update_status(profile_id, state="error", error=str(e))
            return

        if not searches:
            add_log(profile_id, "No search keywords generated")
            update_status(profile_id, state="done", jobs_found=0, jobs_new=0)
            return

        init_status(profile_id, total_searches=len(searches), searches=searches)
        add_log(profile_id, f"Generated {len(searches)} search queries")

        # ── Step 2: Execute searches ──
        update_status(profile_id, state="searching")
        provider = JobRoomProvider()
        all_jobs: list = []

        for idx, search in enumerate(searches):
            query = search.get("query", "")
            add_log(profile_id, f"Searching: «{query}» ({idx + 1}/{len(searches)})")
            update_status(profile_id, current_search=idx + 1)

            try:
                request = self._build_search_request(profile, query)
                response = await asyncio.to_thread(provider.search, request)
                all_jobs.extend(response.items)
                add_log(
                    profile_id,
                    f"Found {len(response.items)} jobs for «{query}»",
                )
            except Exception as e:
                logger.warning(f"Search query «{query}» failed: {e}")
                add_log(profile_id, f"⚠ Search «{query}» failed: {e}")

        if not all_jobs:
            add_log(profile_id, "No jobs found across all queries")
            update_status(profile_id, state="done", jobs_found=0, jobs_new=0)
            return

        add_log(profile_id, f"Total raw results: {len(all_jobs)}")

        # ── Step 3: Deduplicate ──
        seen_urls: set = set()
        unique_jobs: list = []
        existing_urls = {
            j.url for j in self.job_repo.get_by_user(profile.user_id)
        }

        for job in all_jobs:
            url = job.external_url or job.id
            if url in seen_urls or url in existing_urls:
                continue
            seen_urls.add(url)
            unique_jobs.append(job)

        duplicates = len(all_jobs) - len(unique_jobs)
        add_log(
            profile_id,
            f"After dedup: {len(unique_jobs)} new, {duplicates} duplicates",
        )
        update_status(
            profile_id,
            state="analyzing",
            jobs_found=len(all_jobs),
            jobs_new=len(unique_jobs),
            jobs_duplicates=duplicates,
        )

        # ── Step 4: Analyze & save each unique job (Parallel) ──
        # Process jobs in parallel chunks to speed up LLM analysis
        # Limit concurrency to avoid rate limits (e.g., 10 concurrent requests)
        semaphore = asyncio.Semaphore(10)

        async def process_with_limit(job, idx, total):
            async with semaphore:
                add_log(profile_id, f"Analyzing {idx + 1}/{total}: {job.title[:60]}")
                try:
                    return await self._process_job(job, profile, profile_dict)
                except Exception as e:
                    logger.warning(f"Failed to process job {job.id}: {e}")
                    add_log(profile_id, f"⚠ Failed: {job.title[:30]} – {e}")
                    return False

        tasks = [
            process_with_limit(job, idx, len(unique_jobs))
            for idx, job in enumerate(unique_jobs)
        ]
        
        results = await asyncio.gather(*tasks)
        saved_count = sum(1 for r in results if r)

        add_log(profile_id, f"✓ Search complete – {saved_count} jobs saved")
        update_status(
            profile_id,
            state="done",
            jobs_found=len(all_jobs),
            jobs_new=saved_count,
            jobs_duplicates=duplicates,
        )

    # ───────────────────────── private helpers ─────────────────────────

    def _build_search_request(self, profile, query: str) -> JobSearchRequest:
        """Create a JobSearchRequest from profile settings and a keyword query."""
        workload_min, workload_max = 0, 100
        if profile.workload_filter:
            parts = profile.workload_filter.replace("%", "").split("-")
            try:
                workload_min = int(parts[0])
                workload_max = int(parts[1]) if len(parts) > 1 else int(parts[0])
            except ValueError:
                pass

        return JobSearchRequest(
            query=query,
            location=profile.location_filter or "",
            posted_within_days=profile.posted_within_days or 30,
            workload_min=workload_min,
            workload_max=workload_max,
            page_size=50,
            sort=SortOrder.DATE_DESC,
        )

    async def _process_job(self, listing, profile, profile_dict: dict) -> bool:
        """Analyse a single job listing via LLM and save it to DB."""
        # Extract description text
        desc_text = ""
        if listing.descriptions:
            desc_text = listing.descriptions[0].description

        # LLM affinity analysis (in thread)
        analysis = await asyncio.to_thread(
            llm_service.analyze_job_match, profile_dict, desc_text, listing.title
        )

        score = analysis.get("score", 0)
        reasoning = analysis.get("analysis", "")
        worth = analysis.get("worth_applying", False)

        # Company name
        company = listing.company.name if listing.company else "Unknown"

        # Location string
        location_str = ""
        if listing.location:
            location_str = listing.location.city or ""

        # Workload string
        workload_str = ""
        if listing.employment:
            wmin = listing.employment.workload_min
            wmax = listing.employment.workload_max
            workload_str = f"{wmin}-{wmax}%" if wmin != wmax else f"{wmin}%"

        # Application email
        app_email = ""
        if listing.application and listing.application.email:
            app_email = listing.application.email

        # Publication date
        pub_date = None
        if listing.publication and listing.publication.start_date:
            try:
                pub_date = datetime.fromisoformat(listing.publication.start_date)
            except (ValueError, TypeError):
                pass

        # JobRoom URL
        jobroom_url = f"https://www.job-room.ch/offerten/stelle/{listing.id}"

        # Distance calculation
        distance_km = None
        if (
            profile.latitude
            and profile.longitude
            and listing.location
            and listing.location.coordinates
        ):
            distance_km = round(
                haversine_distance(
                    profile.latitude,
                    profile.longitude,
                    listing.location.coordinates.lat,
                    listing.location.coordinates.lon,
                ),
                1,
            )

        job = Job(
            user_id=profile.user_id,
            title=listing.title,
            company=company,
            description=desc_text[:5000] if desc_text else None,
            location=location_str,
            url=listing.external_url or jobroom_url,
            jobroom_url=jobroom_url,
            application_email=app_email or None,
            workload=workload_str or None,
            publication_date=pub_date,
            is_scraped=True,
            source_query=listing.title,
            affinity_score=score,
            affinity_analysis=reasoning[:2000] if reasoning else None,
            worth_applying=worth,
            distance_km=distance_km,
        )

        self.job_repo.db.add(job)
        self.job_repo.db.commit()
        return True


def get_search_service(db) -> SearchService:
    """Factory — create a SearchService with proper repositories."""
    return SearchService(
        job_repo=JobRepository(db),
        profile_repo=ProfileRepository(db),
    )
