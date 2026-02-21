import logging
import asyncio
from typing import List, Any
from datetime import datetime
from backend.repositories.job_repository import JobRepository
from backend.repositories.profile_repository import ProfileRepository
from backend.services.llm_service import llm_service
from backend.services.utils import haversine_distance, clean_html_tags
from backend.providers.jobs.jobroom.client import JobRoomProvider
from backend.providers.jobs.swissdevjobs.client import SwissDevJobsProvider
from backend.providers.jobs.models import JobSearchRequest, SortOrder, RadiusSearchRequest, Coordinates
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

        # Map available providers
        available_providers = {
            "job_room": JobRoomProvider(),
            "swissdevjobs": SwissDevJobsProvider()
        }
        
        provider_infos = [p.get_provider_info() for p in available_providers.values()]

        # ── Step 1: Generate keywords using LLM (run in thread to avoid blocking) ──
        add_log(profile_id, "Generating search plan with AI…")

        try:
            searches = await asyncio.to_thread(
                llm_service.generate_search_plan, profile_dict, provider_infos, profile.max_queries
            )
        except Exception as e:
            logger.error(f"LLM keyword generation failed: {e}")
            update_status(profile_id, state="error", error=str(e))
            return

        if not searches:
            add_log(profile_id, "No search keywords generated")
            update_status(profile_id, state="done", jobs_found=0, jobs_new=0)
            return

        # Deduplicate searches based on query string and provider
        unique_searches = []
        seen_queries = set()
        for s in searches:
            q_str = s.get("query", "").lower().strip()
            p_str = s.get("provider", "").strip()
            key = f"{q_str}:{p_str}"
            if q_str and p_str and key not in seen_queries:
                seen_queries.add(key)
                unique_searches.append(s)

        init_status(profile_id, total_searches=len(unique_searches), searches=unique_searches)
        add_log(profile_id, f"Generated {len(searches)} queries -> {len(unique_searches)} unique")
        
        searches = unique_searches

        # ── Step 2: Execute searches ──
        update_status(profile_id, state="searching")
        
        all_jobs: list = []

        for idx, search in enumerate(searches):
            query = search.get("query", "")
            provider_name = search.get("provider", "")
            
            add_log(profile_id, f"Searching {provider_name}: «{query}» ({idx + 1}/{len(searches)})")
            
            profile = self.profile_repo.get(profile_id) # Re-fetch to get latest state
            if profile and profile.is_stopped:
                logger.info(f"Search profile {profile_id} was stopped by user.")
                update_status(profile_id, state="stopped", error="Search stopped by user.")
                break

            update_status(profile_id, current_search_index=idx + 1)
            
            provider = available_providers.get(provider_name)
            if not provider:
                logger.warning(f"AI requested unknown provider: {provider_name}")
                add_log(profile_id, f"⚠ Skipped unknown provider: {provider_name}")
                continue

            try:
                request = self._build_search_request(profile, query)
                
                # Execute search on specific provider
                result = await provider.search(request)
                
                jobs_found_for_query = len(result.items)
                all_jobs.extend(result.items)
                        
                add_log(
                    profile_id,
                    f"Found {jobs_found_for_query} jobs total for «{query}» on {provider_name}",
                )
            except Exception as e:
                logger.warning(f"Search query «{query}» on {provider_name} failed: {e}")
                add_log(profile_id, f"⚠ Search «{query}» on {provider_name} failed: {e}")

        if not all_jobs:
            add_log(profile_id, "No jobs found across all queries")
            update_status(profile_id, state="done", jobs_found=0, jobs_new=0)
            return

        add_log(profile_id, f"Total raw results: {len(all_jobs)}")

        # ── Step 3: Deduplicate ──
        seen_keys: set = set()
        unique_jobs: list = []
        
        # We need a robust way to identify existing jobs. We will use a composite string pattern "platform:id"
        existing_jobs = self.job_repo.get_by_user(profile.user_id)
        existing_keys = {
            f"{j.platform}:{j.platform_job_id}" for j in existing_jobs
            if j.platform and j.platform_job_id
        }
        
        # Fallback to URLs for older jobs that didn't have platform tags
        existing_urls = {j.url for j in existing_jobs if j.url}

        for listing in all_jobs:
            # listing is a JobListing which has `.source` (e.g. "job_room") and `.id`
            platform = getattr(listing, "source", "unknown")
            platform_id = str(getattr(listing, "id", ""))
            
            key = f"{platform}:{platform_id}"
            url = getattr(listing, "external_url", None) or getattr(listing, "url", None) or platform_id
            
            if (platform and platform_id and (key in seen_keys or key in existing_keys)) or \
               (url and (url in existing_urls and key not in existing_keys)):
                   continue
                   
            if platform and platform_id:
                seen_keys.add(key)
            if url:
                existing_urls.add(url) # Track temporarily for this session
                
            unique_jobs.append(listing)

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
                # Re-fetch profile to check if aborted during analysis
                current_profile = self.profile_repo.get(profile_id)
                if current_profile and current_profile.is_stopped:
                    logger.info(f"Skipping job analysis for {job.id} as search was stopped.")
                    return False
                    
                add_log(profile_id, f"Analyzing {idx + 1}/{total}: {job.title}")
                try:
                    return await self._process_job(job, profile, profile_dict)
                except Exception as e:
                    logger.warning(f"Failed to process job {job.id}: {e}")
                    add_log(profile_id, f"⚠ Failed: {job.title} – {e}")
                    return False

        tasks = [
            process_with_limit(job, idx, len(unique_jobs))
            for idx, job in enumerate(unique_jobs)
        ]
        
        results = await asyncio.gather(*tasks)
        saved_count = sum(1 for r in results if r is True)
        skipped_count = sum(1 for r in results if r is False)

        add_log(profile_id, f"✓ Search complete – {saved_count} jobs saved, {skipped_count} skipped")
        update_status(
            profile_id,
            state="done",
            jobs_found=len(all_jobs),
            jobs_new=saved_count,
            jobs_duplicates=duplicates,
            jobs_skipped=skipped_count
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

        radius_request = None
        if profile.latitude and profile.longitude:
            # Default to 30km if not specified, or use profile preference if available
            # Assuming profile has no explicit distance pref, defaulting to 50 as per user payload example
            dist = 50 
            if hasattr(profile, 'search_radius') and profile.search_radius:
                 dist = int(profile.search_radius)
            
            radius_request = RadiusSearchRequest(
                geo_point=Coordinates(lat=profile.latitude, lon=profile.longitude),
                distance=dist
            )

        return JobSearchRequest(
            query=query,
            location=profile.location_filter or "",
            posted_within_days=profile.posted_within_days or 30,
            workload_min=workload_min,
            workload_max=workload_max,
            page_size=50,
            sort=SortOrder.DATE_DESC,
            radius_search=radius_request,
            communal_codes=[] # Clear communal codes if using radius to avoid conflict? usually they can coexist or radius overrides.
        )

    async def _process_job(self, listing, profile, profile_dict: dict) -> bool:
        """Analyse a single job listing via LLM and save it to DB."""
        # Step A: Title Relevance Check First (User Request)
        relevance = await asyncio.to_thread(
            llm_service.check_title_relevance, listing.title, profile.role_description or ""
        )
        if not relevance.get("relevant", True):
            logger.info(f"Skipping job due to title irrelevance: {listing.title}")
            return False

        # Extract description text
        desc_text = ""
        if listing.descriptions:
            desc_text = listing.descriptions[0].description

        # Enriched Metadata for deep analysis
        # Includes title, description, location, workload, languages, etc.
        job_metadata = {
            "title": listing.title,
            "description": desc_text, 
            "location": listing.location.city if listing.location else "Unknown",
            "workload": f"{listing.employment.workload_min}-{listing.employment.workload_max}%" if listing.employment else "Unknown",
            "languages": [f"{s.language_code} ({s.spoken_level})" for s in listing.language_skills] if listing.language_skills else [],
            "company": listing.company.name if listing.company else "Unknown",
        }

        # LLM affinity analysis (Deep)
        analysis = await asyncio.to_thread(
            llm_service.analyze_job_match, job_metadata, profile_dict
        )

        score = analysis.get("affinity_score", 0)
        reasoning = analysis.get("affinity_analysis", "")
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
                # Handle ISO format with Z or other offsets
                date_str = listing.publication.start_date.replace('Z', '+00:00')
                pub_date = datetime.fromisoformat(date_str)
            except (ValueError, TypeError):
                pass

        # JobRoom URL
        jobroom_url = f"https://www.job-room.ch/job-search/{listing.id}"

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
            title=clean_html_tags(listing.title),
            company=company,
            description=clean_html_tags(desc_text) if desc_text else None,
            location=location_str,
            url=listing.external_url or jobroom_url,
            jobroom_url=jobroom_url,
            search_profile_id=profile.id,
            platform=getattr(listing, "source", "unknown"),
            platform_job_id=str(getattr(listing, "id", "")),
            application_email=app_email or None,
            workload=workload_str or None,
            publication_date=pub_date,
            is_scraped=True,
            source_query=listing.title,
            affinity_score=score,
            affinity_analysis=reasoning if reasoning else None,
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
