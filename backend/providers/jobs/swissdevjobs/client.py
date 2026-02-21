"""
SwissDevJobs API Client.

Client for swissdevjobs.ch fetching via the jobsLight API and retrieving details via jobWithUrl.
"""

import logging
import time
from datetime import datetime
from typing import Any, List, Dict

import httpx
from pydantic import ValidationError

from backend.providers.jobs.exceptions import (
    ProviderError,
    ResponseParseError,
)
from backend.providers.jobs.models import (
    ApplicationChannel,
    CompanyInfo,
    JobListing,
    JobLocation,
    JobSearchRequest,
    JobSearchResponse,
    ProviderCapabilities,
    ProviderHealth,
    ProviderStatus,
    Coordinates,
)
from backend.providers.jobs.base import JobProvider as BaseJobProvider
from backend.services.utils import haversine_distance

logger = logging.getLogger(__name__)

API_BASE_URL = "https://swissdevjobs.ch/api"

class SwissDevJobsProvider(BaseJobProvider):
    """
    SwissDevJobs HTML/API Provider.

    Usage:
        provider = SwissDevJobsProvider()
        response = await provider.search(JobSearchRequest(
            query="React",
            location="Zürich",
        ))
    """

    def __init__(self, include_raw_data: bool = False):
        self._include_raw_data = include_raw_data
        self._client: httpx.AsyncClient | None = None

    @property
    def name(self) -> str:
        return "swissdevjobs"

    @property
    def display_name(self) -> str:
        return "SwissDevJobs.ch"

    def get_provider_info(self) -> "ProviderInfo":
        from backend.providers.jobs.models import ProviderInfo
        return ProviderInfo(
            name=self.name,
            description="Exclusive job board for Software Engineers and IT professionals in Switzerland. Do NOT use this for non-IT jobs (e.g. HR, marketing, medical).",
            domain="swissdevjobs.ch"
        )

    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            supports_radius_search=True,
            supports_canton_filter=False,
            supports_profession_codes=False, # Depends on specific technical tags mostly
            supports_language_skills=False,
            supports_company_filter=True,
            supports_work_forms=True, # e.g. remote parsing available
            max_page_size=50,
            supported_languages=["en", "de"],
            supported_sort_orders=["date_desc"],
        )

    async def __aenter__(self) -> "SwissDevJobsProvider":
        self._client = httpx.AsyncClient(timeout=30.0)
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        await self.close()

    async def close(self) -> None:
        """Close HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def search(self, request: JobSearchRequest) -> JobSearchResponse:
        """Search for jobs on swissdevjobs.ch."""
        start_time = time.time()
        
        should_close = False
        if not self._client:
            self._client = httpx.AsyncClient(timeout=30.0)
            should_close = True

        try:
            # Step 1: Fetch the bulk list
            response = await self._client.get(f"{API_BASE_URL}/jobsLight")
            response.raise_for_status()
            
            all_jobs_light = response.json()
            if not isinstance(all_jobs_light, list):
                 raise ResponseParseError(self.name, "Expected a list from jobsLight API")

            # Step 2: In-memory filtering
            filtered_jobs = []
            
            # Extract basic search criteria
            query = request.query.lower() if request.query else ""
            location_query = request.location.lower() if request.location else ""
            
            for job in all_jobs_light:
                # 1. Filter by keyword (Tokenized Match)
                if query:
                   title = job.get("name", "").lower()
                   techs = " ".join([t.lower() for t in job.get("technologies", [])])
                   tags = " ".join([t.lower() for t in job.get("filterTags", [])])
                   combined_text = f"{title} {techs} {tags}"
                   
                   tokens = query.split()
                   match = all(token in combined_text for token in tokens)
                   if not match:
                        continue
                
                # 2. Filter by location text simply
                if location_query and not request.radius_search:
                    city = job.get("actualCity", "").lower()
                    cat = job.get("cityCategory", "").lower()
                    if location_query not in city and location_query not in cat:
                        continue
                
                # 3. Filter by distance if specified
                if request.radius_search:
                   lat = job.get("latitude")
                   lon = job.get("longitude")
                   if lat and lon:
                       dist = haversine_distance(
                           request.radius_search.geo_point.lat,
                           request.radius_search.geo_point.lon,
                           float(lat), float(lon)
                       )
                       if dist > request.radius_search.distance:
                           continue
                   else:
                       continue # Skip jobs with no location when radius search is active
                       
                # 4. Filter by company Name
                if request.company_name:
                    company = job.get("company", "").lower()
                    if request.company_name.lower() not in company:
                        continue
                        
                # 5. Filter by Workload
                job_type = job.get("jobType", "").lower()
                if "part-time" in job_type and request.workload_min >= 90:
                    continue # Exclude part time if looking for >=90%
                if "full-time" in job_type and request.workload_max <= 80:
                    continue # Exclude full time if looking for <=80%
                    
                # 6. Filter by Language
                if request.language_skills:
                    req_langs = [ls.language_code.lower() for ls in request.language_skills]
                    job_lang = job.get("language", "").lower()
                    lang_map = {"en": "english", "de": "german", "fr": "french", "it": "italian"}
                    allowed_job_langs = [lang_map.get(code, code) for code in req_langs]
                    if job_lang and job_lang not in allowed_job_langs:
                        continue
                        
                # 7. Filter by WorkForm (remote/home_office)
                if request.work_forms:
                    wf_values = [wf.value for wf in request.work_forms]
                    job_workplace = job.get("workplace", "").lower()
                    if "home_office" in wf_values:
                        if job_workplace not in ["remote", "hybrid"]:
                            continue

                filtered_jobs.append(job)

            # Step 3: Pagination
            page = request.page
            page_size = request.page_size
            total_count = len(filtered_jobs)
            start_idx = page * page_size
            end_idx = start_idx + page_size
            
            page_items = filtered_jobs[start_idx:end_idx]
            
            # Step 4: Fetch details for the paginated items
            hydrated_jobs = []
            for light_job in page_items:
                 job_url_slug = light_job.get("jobUrl")
                 if not job_url_slug:
                     continue
                     
                 try:
                     detail_res = await self._client.get(f"{API_BASE_URL}/jobWithUrl/{job_url_slug}")
                     if detail_res.status_code == 200:
                         detail_data = detail_res.json()
                         
                         if isinstance(detail_data, list) and len(detail_data) > 0:
                             detail_data = detail_data[0]
                             
                         job_listing = self._transform_job(detail_data, light_job)
                         if job_listing:
                             hydrated_jobs.append(job_listing)
                 except Exception as e:
                     logger.warning(f"Failed to fetch details for {job_url_slug} on {self.name}: {e}")

            elapsed_ms = int((time.time() - start_time) * 1000)

            return JobSearchResponse(
                items=hydrated_jobs,
                total_count=total_count,
                page=page,
                page_size=page_size,
                total_pages=(total_count + page_size - 1) // page_size if page_size > 0 else 1,
                source=self.name,
                search_time_ms=elapsed_ms,
                request=request,
            )

        except Exception as e:
            logger.error(f"Search failed: {e}")
            raise ProviderError(self.name, f"Search failed: {e}") from e
        finally:
            if should_close and self._client:
                await self.close()

    async def health_check(self) -> ProviderHealth:
        """Check if swissdevjobs.ch API is accessible."""
        start_time = time.time()
        should_close = False
        
        if not self._client:
            self._client = httpx.AsyncClient(timeout=10.0)
            should_close = True

        try:
            response = await self._client.get(f"{API_BASE_URL}/jobsLight")
            latency_ms = int((time.time() - start_time) * 1000)
            
            if response.status_code == 200:
                return ProviderHealth(
                    provider=self.name,
                    status=ProviderStatus.HEALTHY,
                    latency_ms=latency_ms,
                    message="API accessible",
                )
            else:
                return ProviderHealth(
                    provider=self.name,
                    status=ProviderStatus.DEGRADED,
                    latency_ms=latency_ms,
                    message=f"HTTP {response.status_code}",
                )
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            return ProviderHealth(
                provider=self.name,
                status=ProviderStatus.UNAVAILABLE,
                latency_ms=latency_ms,
                message=str(e),
            )
        finally:
            if should_close:
                await self.close()

    def _transform_job(self, detail: dict[str, Any], light: dict[str, Any]) -> JobListing | None:
        """Transform JSON to JobListing."""
        try:
            job_id = detail.get("_id") or light.get("_id")
            if not job_id:
                return None
                
            title = detail.get("name") or light.get("name", "Unknown Title")
            company_name = detail.get("company") or light.get("company", "Unknown Company")
            
            external_url = f"https://swissdevjobs.ch/jobs/{light.get('jobUrl', '')}"
            redirect_url = detail.get("redirectJobUrl") or light.get("redirectJobUrl")
            
            if redirect_url:
                application_url = redirect_url
            else:
                application_url = None
                
            contact_email = None
            if detail.get("candidateContactWay") == "Email":
                 # They don't typically expose the email directly in the GET payload if it's via their system,
                 # but we can set the form submission URL or check for an email
                 contact_email = detail.get("personEmail")

            description_html = detail.get("description", "")
            
            # Enrich description with tech tags if available
            techs = detail.get("technologies") or light.get("technologies", [])
            if techs:
                 tech_str = ", ".join(techs)
                 description_html += f"\\n\\nTechnologies: {tech_str}"

            # Location handling
            lat = detail.get("latitude") or light.get("latitude")
            lon = detail.get("longitude") or light.get("longitude")
            
            coordinates = None
            if lat and lon:
                coordinates = Coordinates(lat=float(lat), lon=float(lon))
                
            location = JobLocation(
                city=detail.get("actualCity") or light.get("actualCity") or detail.get("cityCategory") or "",
                postal_code=detail.get("postalCode") or light.get("postalCode"),
                country_code="CH",
                coordinates=coordinates
            )
            
            company = CompanyInfo(
                name=company_name,
                website=detail.get("companyWebsiteLink") or light.get("companyWebsiteLink")
            )

            application = ApplicationChannel(
                email=contact_email,
                form_url=application_url
            )
            
            # Date
            created_at = None
            active_from = detail.get("activeFrom") or light.get("activeFrom")
            if active_from:
                try:
                    created_at = datetime.fromisoformat(active_from.replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    pass
                    
            return JobListing(
                id=str(job_id),
                source=self.name,
                title=title,
                descriptions=[{"language_code": "en", "title": title, "description": description_html}],
                external_url=external_url,
                company=company,
                location=location,
                application=application,
                created_at=created_at,
                raw_data=detail if self._include_raw_data else None,
            )
        except ValidationError as e:
            logger.warning(f"Validation error transforming job {light.get('jobUrl')}: {e}")
            return None
        except Exception as e:
            logger.warning(f"Unexpected error transforming job {light.get('jobUrl')}: {e}")
            return None
