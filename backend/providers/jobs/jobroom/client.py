"""
Job-Room API Client.

Production-grade client for job-room.ch with:
- Full support for all API filters
- CSRF token handling for Angular security bypass
- Browser fingerprint simulation
- Multiple execution modes
"""

import logging
import time
from datetime import datetime
from typing import Any, cast

from backend.providers.jobs.exceptions import (
    ProviderError,
    ResponseParseError,
)
from backend.providers.jobs.models import (
    ApplicationChannel,
    CompanyInfo,
    ContactInfo,
    ContractType,
    Coordinates,
    EmploymentDetails,
    JobDescription,
    JobListing,
    JobLocation,
    JobSearchRequest,
    JobSearchResponse,
    LanguageSkill,
    Occupation,
    PublicationInfo,
    SortOrder,
    ProviderCapabilities,
    ProviderHealth,
    ProviderStatus,
)
from backend.providers.jobs.base import (
    JobProvider as BaseJobProvider,
)
# ProviderCapabilities, ProviderHealth, ProviderStatus are now in models.py
from backend.providers.jobs.session import ExecutionMode, ProxyPool, ScraperSession
from backend.providers.jobs.jobroom.constants import (
    API_BASE,
    BASE_URL,
    LANGUAGE_PARAMS,
    SEARCH_ENDPOINT,
)
from backend.providers.jobs.jobroom.mapper import BFSLocationMapper

logger = logging.getLogger(__name__)


class JobRoomProvider(BaseJobProvider):
    """
    Job-room.ch API provider.

    Implements the BaseJobProvider interface for accessing Swiss federal
    job portal data. Supports all available filters and handles the
    Angular CSRF security mechanism.

    Usage:
        async with JobRoomProvider() as provider:
            response = await provider.search(JobSearchRequest(
                query="Software Engineer",
                location="Zürich",
                workload_min=80
            ))

            for job in response.items:
                print(f"{job.title} at {job.company.name}")
    """

    def __init__(
        self,
        mode: ExecutionMode = ExecutionMode.STEALTH,
        proxy_pool: ProxyPool | None = None,
        include_raw_data: bool = False,
    ):
        self._mode = mode
        self._proxy_pool = proxy_pool
        self._include_raw_data = include_raw_data
        self._session: ScraperSession | None = None
        self._mapper = BFSLocationMapper()
        self._csrf_initialized = False

    @property
    def name(self) -> str:
        return "job_room"

    @property
    def display_name(self) -> str:
        return "Job-Room.ch (SECO)"

    def get_provider_info(self) -> "ProviderInfo":
        from backend.providers.jobs.models import ProviderInfo
        return ProviderInfo(
            name=self.name,
            description="Generalist Swiss federal job portal. Contains jobs across all industries and professions (IT, construction, hospitality, medical, etc.). Good default choice.",
            domain="job-room.ch"
        )

    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            supports_radius_search=True,
            supports_canton_filter=True,
            supports_profession_codes=True,
            supports_language_skills=True,
            supports_company_filter=True,
            supports_work_forms=True,
            max_page_size=100,
            supported_languages=["en", "de", "fr", "it"],
            supported_sort_orders=["date_desc", "date_asc", "relevance"],
        )

    async def __aenter__(self) -> "JobRoomProvider":
        await self._init_session()
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        await self.close()

    async def _init_session(self) -> None:
        """Initialize HTTP session with CSRF token."""
        if self._session is None:
            self._session = ScraperSession(
                mode=self._mode,
                proxy_pool=self._proxy_pool,
                base_url=BASE_URL,
            )
            await self._session.start()

        if self._session and not self._csrf_initialized:
            await self._session.refresh_csrf_token(BASE_URL)
            self._csrf_initialized = True

    async def close(self) -> None:
        """Close provider resources."""
        if self._session:
            await self._session.close()
            self._session = None
            self._csrf_initialized = False

    # =========================================================================
    # Search Implementation
    # =========================================================================

    async def search(self, request: JobSearchRequest) -> JobSearchResponse:
        """Search for jobs on job-room.ch with all available filters."""
        await self._init_session()
        start_time = time.time()

        payload = self._build_search_payload(request)

        await self._init_session()
        assert self._session is not None
        url = self._build_search_url(request)

        try:
            response = await self._session.with_retry_csrf(
                method="POST",
                url=url,
                csrf_refresh_url=BASE_URL,
                json=payload,
            )

            data = response.json()

            if isinstance(data, list):
                jobs = data
                total_count = len(jobs)
            elif isinstance(data, dict):
                jobs = cast(
                    list[Any], data.get("content", data.get("jobAdvertisements", []))
                )
                total_count = data.get("totalElements", len(jobs))
            else:
                raise ResponseParseError(
                    self.name, f"Unexpected response format: {type(data)}"
                )

            items = [self._transform_job(job) for job in jobs]

            elapsed_ms = int((time.time() - start_time) * 1000)

            return JobSearchResponse(
                items=items,
                total_count=total_count,
                page=request.page,
                page_size=request.page_size,
                total_pages=(total_count + request.page_size - 1) // request.page_size,
                source=self.name,
                search_time_ms=elapsed_ms,
                request=request,
            )

        except Exception as e:
            logger.error(f"Search failed: {e}")
            raise ProviderError(self.name, f"Search failed: {e}") from e

    def _build_search_payload(self, request: JobSearchRequest) -> dict[str, Any]:
        """Build the API request payload with all filters."""
        communal_codes = list(request.communal_codes)
        if request.location:
            resolved = self._mapper.resolve_safe(request.location)
            communal_codes.extend(resolved)

        keywords: list[str] = list(request.keywords)
        if request.query:
            keywords.append(request.query)

        permanent: bool | None = None
        if request.contract_type == ContractType.PERMANENT:
            permanent = True
        elif request.contract_type == ContractType.TEMPORARY:
            permanent = False

        radius_search = None
        if request.radius_search:
            radius_search = {
                "geoPoint": {
                    "lat": request.radius_search.geo_point.lat,
                    "lon": request.radius_search.geo_point.lon,
                },
                "distance": request.radius_search.distance,
            }

        [wf.value for wf in request.work_forms]

        language_skills = []
        for ls in request.language_skills:
            skill = {"languageIsoCode": ls.language_code}
            if ls.spoken_level:
                skill["spokenLevel"] = ls.spoken_level.value
            if ls.written_level:
                skill["writtenLevel"] = ls.written_level.value
            language_skills.append(skill)

        payload: dict[str, Any] = {
            "workloadPercentageMin": request.workload_min,
            "workloadPercentageMax": request.workload_max,
            "permanent": permanent,
            "companyName": request.company_name,
            "onlineSince": request.posted_within_days,
            "displayRestricted": request.display_restricted,
            "professionCodes": [
                {"type": "AVAM", "value": code} for code in request.profession_codes
            ],
            "keywords": keywords if keywords else [],
            "communalCodes": communal_codes if communal_codes else [],
            "cantonCodes": list(request.canton_codes) if request.canton_codes else [],
        }

        if radius_search:
            payload["radiusSearchRequest"] = radius_search

        logger.debug(f"Built search payload: {payload}")
        return payload

    def _build_search_url(self, request: JobSearchRequest) -> str:
        """Build search URL with query parameters."""
        sort_map = {
            SortOrder.DATE_DESC: "date_desc",
            SortOrder.DATE_ASC: "date_asc",
            SortOrder.RELEVANCE: "relevance",
        }
        sort = sort_map.get(request.sort, "date_desc")
        lang_param = LANGUAGE_PARAMS.get(request.language, "ZW4=")

        url = (
            f"{SEARCH_ENDPOINT}"
            f"?page={request.page}"
            f"&size={request.page_size}"
            f"&sort={sort}"
            f"&_ng={lang_param}"
        )

        return url

    # =========================================================================
    # Job Details Implementation
    # =========================================================================

    async def get_details(self, job_id: str, language: str = "en") -> JobListing:
        """Get full details for a specific job."""
        await self._init_session()
        assert self._session is not None

        lang_param = LANGUAGE_PARAMS.get(language, "ZW4=")
        url = f"{API_BASE}/{job_id}?_ng={lang_param}"

        try:
            response = await self._session.with_retry_csrf(
                method="GET",
                url=url,
                csrf_refresh_url=BASE_URL,
            )

            data = response.json()
            return self._transform_job({"jobAdvertisement": data})

        except Exception as e:
            logger.error(f"Failed to get job details: {e}")
            raise ProviderError(self.name, f"Failed to get job details: {e}") from e

    # =========================================================================
    # Health Check
    # =========================================================================

    async def health_check(self) -> ProviderHealth:
        """Check if job-room.ch is accessible."""
        start_time = time.time()

        try:
            await self._init_session()
            assert self._session is not None

            response = await self._session.get(BASE_URL)
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

    # =========================================================================
    # Data Transformation
    # =========================================================================

    def _transform_job(self, raw: dict[str, Any]) -> JobListing:
        """Transform job-room.ch response to generalized JobListing."""
        job = raw.get("jobAdvertisement", raw)
        content = job.get("jobContent", {})

        # Extract descriptions (multilingual)
        descriptions = []
        for desc in content.get("jobDescriptions", []):
            descriptions.append(
                JobDescription(
                    language_code=desc.get("languageIsoCode", "en"),
                    title=desc.get("title", ""),
                    description=desc.get("description", ""),
                )
            )

        title = ""
        if descriptions:
            title = descriptions[0].title

        # Extract company info
        company_data = content.get("company", {})
        company = CompanyInfo(
            name=company_data.get("name"),
            street=company_data.get("street"),
            house_number=company_data.get("houseNumber"),
            postal_code=company_data.get("postalCode"),
            city=company_data.get("city"),
            country_code=company_data.get("countryIsoCode"),
            phone=company_data.get("phone"),
            email=company_data.get("email"),
            website=company_data.get("website"),
            is_agency=company_data.get("surrogate", False),
        )

        # Extract location
        location_data = content.get("location") or {}
        coords_data = location_data.get("coordinates") or {}
        coordinates = None
        if coords_data.get("lat") and coords_data.get("lon"):
            try:
                coordinates = Coordinates(
                    lat=float(coords_data["lat"]),
                    lon=float(coords_data["lon"]),
                )
            except (ValueError, TypeError):
                pass

        location = JobLocation(
            city=location_data.get("city", ""),
            postal_code=location_data.get("postalCode"),
            canton_code=location_data.get("cantonCode"),
            region_code=location_data.get("regionCode"),
            communal_code=location_data.get("communalCode"),
            country_code=location_data.get("countryIsoCode", "CH"),
            coordinates=coordinates,
            remarks=location_data.get("remarks"),
        )

        # Extract employment details
        emp_data = content.get("employment", {})
        employment = EmploymentDetails(
            start_date=emp_data.get("startDate"),
            end_date=emp_data.get("endDate"),
            is_permanent=emp_data.get("permanent", True),
            is_immediate=emp_data.get("immediately", False),
            is_short_employment=emp_data.get("shortEmployment", False),
            workload_min=self._safe_int(emp_data.get("workloadPercentageMin"), 100),
            workload_max=self._safe_int(emp_data.get("workloadPercentageMax"), 100),
            work_forms=emp_data.get("workForms", []),
        )

        # Extract occupations
        occupations = []
        for occ in content.get("occupations", []):
            occupations.append(
                Occupation(
                    avam_code=occ.get("avamOccupationCode", ""),
                    work_experience=occ.get("workExperience"),
                    education_code=occ.get("educationCode"),
                    qualification_code=occ.get("qualificationCode"),
                )
            )

        # Extract language skills
        language_skills = []
        for ls in content.get("languageSkills", []):
            language_skills.append(
                LanguageSkill(
                    language_code=ls.get("languageIsoCode", ""),
                    spoken_level=ls.get("spokenLevel"),
                    written_level=ls.get("writtenLevel"),
                )
            )

        # Extract contact info
        contact_data = content.get("publicContact", {})
        contact = (
            ContactInfo(
                salutation=contact_data.get("salutation"),
                first_name=contact_data.get("firstName"),
                last_name=contact_data.get("lastName"),
                phone=contact_data.get("phone"),
                email=contact_data.get("email"),
            )
            if contact_data
            else None
        )

        # Extract application channel
        apply_data = content.get("applyChannel") or {}

        post_address = apply_data.get("postAddress") or apply_data.get("rawPostAddress")
        if isinstance(post_address, dict):
            addr_parts = []
            if post_address.get("name"):
                addr_parts.append(post_address["name"])
            if post_address.get("street"):
                street = post_address["street"]
                if post_address.get("houseNumber"):
                    street += f" {post_address['houseNumber']}"
                addr_parts.append(street)
            if post_address.get("postalCode") or post_address.get("city"):
                addr_parts.append(
                    f"{post_address.get('postalCode', '')} {post_address.get('city', '')}".strip()
                )
            if post_address.get("countryIsoCode") and post_address["countryIsoCode"] != "CH":
                addr_parts.append(post_address["countryIsoCode"])
            post_address = ", ".join(addr_parts) if addr_parts else None

        application = (
            ApplicationChannel(
                email=apply_data.get("emailAddress"),
                phone=apply_data.get("phoneNumber"),
                form_url=apply_data.get("formUrl"),
                post_address=post_address,
                additional_info=apply_data.get("additionalInfo"),
            )
            if apply_data
            else None
        )

        # Extract publication info
        pub_data = job.get("publication", {})
        publication = (
            PublicationInfo(
                start_date=pub_data.get("startDate", ""),
                end_date=pub_data.get("endDate", ""),
                public_display=pub_data.get("publicDisplay", True),
                eures_display=pub_data.get("euresDisplay", False),
                company_anonymous=pub_data.get("companyAnonymous", False),
                restricted_display=pub_data.get("restrictedDisplay", False),
            )
            if pub_data
            else None
        )

        # Parse timestamps
        created_at = None
        if job.get("createdTime"):
            try:
                created_at = datetime.fromisoformat(
                    job["createdTime"].replace("Z", "+00:00")
                )
            except (ValueError, TypeError):
                pass

        updated_at = None
        if job.get("updatedTime"):
            try:
                updated_at = datetime.fromisoformat(
                    job["updatedTime"].replace("Z", "+00:00")
                )
            except (ValueError, TypeError):
                pass

        return JobListing(
            id=job.get("id", ""),
            source=self.name,
            external_reference=job.get("externalReference"),
            stellennummer_egov=job.get("stellennummerEgov"),
            stellennummer_avam=job.get("stellennummerAvam"),
            title=title,
            descriptions=descriptions,
            external_url=content.get("externalUrl"),
            company=company,
            location=location,
            number_of_positions=self._safe_int(content.get("numberOfJobs"), 1),
            employment=employment,
            occupations=occupations,
            language_skills=language_skills,
            contact=contact,
            application=application,
            publication=publication,
            created_at=created_at,
            updated_at=updated_at,
            status=job.get("status"),
            reporting_obligation=job.get("reportingObligation", False),
            reporting_obligation_end_date=job.get("reportingObligationEndDate"),
            raw_data=raw if self._include_raw_data else None,
        )

    @staticmethod
    def _safe_int(value: Any, default: int = 0) -> int:
        """Safely convert value to int."""
        if value is None:
            return default
        try:
            return int(value)
        except (ValueError, TypeError):
            return default
