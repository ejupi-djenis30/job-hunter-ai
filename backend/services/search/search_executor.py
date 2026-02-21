import logging
import asyncio
from datetime import datetime
from backend.services.llm_service import llm_service
from backend.services.utils import haversine_distance, clean_html_tags
from backend.models import Job

logger = logging.getLogger(__name__)

async def process_job_listing(listing, profile, profile_dict: dict, db_session) -> bool:
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

    # Parsing fields
    company = listing.company.name if listing.company else "Unknown"
    location_str = listing.location.city if listing.location else ""
    
    workload_str = ""
    if listing.employment:
        wmin = listing.employment.workload_min
        wmax = listing.employment.workload_max
        workload_str = f"{wmin}-{wmax}%" if wmin != wmax else f"{wmin}%"

    app_email = ""
    if listing.application and listing.application.email:
        app_email = listing.application.email

    pub_date = None
    if listing.publication and listing.publication.start_date:
        try:
            date_str = listing.publication.start_date.replace('Z', '+00:00')
            pub_date = datetime.fromisoformat(date_str)
        except (ValueError, TypeError):
            pass

    jobroom_url = f"https://www.job-room.ch/job-search/{listing.id}"

    distance_km = None
    if (profile.latitude and profile.longitude and 
        listing.location and listing.location.coordinates):
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

    db_session.add(job)
    db_session.commit()
    return True
