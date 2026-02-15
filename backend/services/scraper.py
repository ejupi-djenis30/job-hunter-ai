import asyncio
import logging
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from backend.scraper.providers.job_room.client import JobRoomProvider
from backend.scraper.core.session import ExecutionMode
from backend.scraper.core.models import JobSearchRequest, RadiusSearchRequest, GeoPoint
from backend.scraper.core.exceptions import ProviderError

from backend import models, schemas
from backend.services import llm, reference
from backend.services.search_status import init_status, add_log, update_status

logger = logging.getLogger(__name__)


def _extract_analysis_metadata(job_listing) -> dict:
    """
    Extract only the relevant metadata from a JobListing for LLM analysis.
    Avoids sending the full JSON dump — saves tokens and focuses the model.
    """
    metadata = {
        "title": job_listing.title,
        "company": job_listing.company.name if job_listing.company else "Unknown",
        "location": job_listing.location.city if job_listing.location else "",
    }
    
    # Description (first language only)
    if job_listing.descriptions:
        metadata["description"] = job_listing.descriptions[0].description[:2000]  # Cap at 2000 chars
    
    # Employment details
    if job_listing.employment:
        metadata["workload"] = f"{job_listing.employment.workload_min}-{job_listing.employment.workload_max}%"
        metadata["is_permanent"] = job_listing.employment.is_permanent
        if job_listing.employment.start_date:
            metadata["start_date"] = job_listing.employment.start_date
    
    # Language requirements (critical for Swiss market)
    if job_listing.language_skills:
        metadata["required_languages"] = [
            {
                "language": ls.language_code,
                "spoken": ls.spoken_level,
                "written": ls.written_level,
            }
            for ls in job_listing.language_skills
        ]
    
    # Occupations (AVAM codes)  
    if job_listing.occupations:
        metadata["occupations"] = [
            {
                "avam_code": occ.avam_code,
                "experience": occ.work_experience,
                "education": occ.education_code,
            }
            for occ in job_listing.occupations
        ]
    
    return metadata


async def run_search_workflow(profile_id: int, db: Session, user_id: int = None):
    """
    Main workflow:
    1. Fetch profile
    2. Generate keywords (LLM)
    3. Iterate searches (with local cache check)
    4. Phase 1: Title pre-filter
    5. Phase 2: Analyze with curated metadata
    6. Save to DB
    """
    logger.info(f"Starting search workflow for profile {profile_id}")
    
    # 1. Fetch Profile
    profile = db.query(models.SearchProfile).filter(models.SearchProfile.id == profile_id).first()
    if not profile:
        logger.error("Profile not found")
        return
    
    # Use profile's user_id if not explicitly passed
    if user_id is None:
        user_id = profile.user_id

    # Initialize status
    init_status(profile_id, 0, [])
    add_log(profile_id, "🚀 Search workflow started")

    # 2. Generate Keywords
    add_log(profile_id, "🤖 Generating search queries with AI...")
    update_status(profile_id, state="generating")
    
    profile_dict = {
        "role_description": profile.role_description,
        "search_strategy": profile.search_strategy,
        "location": profile.location_filter,
        "workload": profile.workload_filter,
        "cv_content": profile.cv_content or "",
    }
    
    search_configs = llm.generate_search_keywords(profile_dict)
    logger.info(f"Generated {len(search_configs)} search configurations")
    
    # Update status with generated searches
    update_status(profile_id,
        state="searching",
        total_searches=len(search_configs),
        searches_generated=search_configs
    )
    add_log(profile_id, f"✅ AI generated {len(search_configs)} search queries")
    
    for i, config in enumerate(search_configs):
        search_desc = _describe_search(config)
        add_log(profile_id, f"📋 Query {i+1}: {search_desc}")
    
    # 3. Iterate Searches
    provider = None
    try:
        # Try to initialize provider with retries
        provider = JobRoomProvider(mode=ExecutionMode.STEALTH)
        for attempt in range(3):
            try:
                await provider.__aenter__()
                add_log(profile_id, "✅ Connected to Job-Room.ch")
                break
            except Exception as init_err:
                logger.warning(f"Provider init attempt {attempt+1}/3 failed: {init_err}")
                add_log(profile_id, f"⚠️ Connection attempt {attempt+1}/3 failed: {str(init_err)[:60]}")
                if attempt < 2:
                    await asyncio.sleep(3 * (attempt + 1))
                else:
                    add_log(profile_id, "⚠️ CSRF init failed, will retry per search request")
                    logger.warning("All provider init attempts failed, proceeding without CSRF")

        for i, config in enumerate(search_configs):
                search_type = config.get("type", "keyword")
                value = config.get("value", "")
                
                if not value and search_type not in ["combined"]:
                    continue
                    
                query = ""
                profession_codes = []
                
                search_desc = _describe_search(config)
                update_status(profile_id,
                    current_search_index=i + 1,
                    current_query=search_desc
                )
                add_log(profile_id, f"🔍 [{i+1}/{len(search_configs)}] Searching: {search_desc}")
                
                if search_type == "occupation":
                    code = await reference.resolve_occupation_code(value)
                    if code:
                        logger.info(f"Resolved occupation '{value}' to code {code}")
                        profession_codes.append(code)
                        query = value
                        add_log(profile_id, f"   ✅ Resolved '{value}' → AVAM code {code}")
                    else:
                        logger.warning(f"Could not resolve occupation '{value}', falling back to keyword search")
                        query = value
                        add_log(profile_id, f"   ⚠️ '{value}' not found as occupation, using as keyword")
                elif search_type == "combined":
                    occupation = config.get("occupation", "")
                    keywords = config.get("keywords", "")
                    if occupation:
                        code = await reference.resolve_occupation_code(occupation)
                        if code:
                            logger.info(f"Combined search: resolved '{occupation}' to code {code}, keywords='{keywords}'")
                            profession_codes.append(code)
                            query = keywords if keywords else occupation
                            add_log(profile_id, f"   ✅ Resolved '{occupation}' → code {code}, keywords: {keywords}")
                        else:
                            logger.warning(f"Could not resolve occupation '{occupation}' in combined search, adding to keywords")
                            query = f"{occupation} {keywords}".strip()
                            add_log(profile_id, f"   ⚠️ '{occupation}' not found, merged into keywords: {query}")
                    else:
                        query = keywords
                else:
                    query = value
                
                location = profile.location_filter
                
                logger.info(f"Running search for: query='{query}', professions={profession_codes} in {location}")
                
                scrape_mode = getattr(profile, 'scrape_mode', 'sequential') or 'sequential'
                try:
                    await run_single_search(
                        provider, query, profession_codes, location,
                        profile, db, scrape_mode, profile_id, user_id
                    )
                except Exception as search_err:
                    logger.error(f"Search '{search_desc}' failed: {search_err}")
                    add_log(profile_id, f"   ❌ Search failed: {str(search_err)[:80]}")
                    update_status(profile_id, errors=_get_field(profile_id, "errors") + 1)
                    continue
        
        update_status(profile_id, state="done", finished_at=datetime.now().isoformat())
        add_log(profile_id, "🎉 Search workflow completed!")
        
    except Exception as e:
        logger.error(f"Fatal error in search workflow: {e}")
        update_status(profile_id, state="error", finished_at=datetime.now().isoformat())
        add_log(profile_id, f"❌ Fatal error: {str(e)}")
    finally:
        if provider:
            try:
                await provider.__aexit__(None, None, None)
            except Exception:
                pass


async def run_single_search(
    provider: JobRoomProvider,
    query: str,
    profession_codes: List[str],
    location: str,
    profile: models.SearchProfile,
    db: Session,
    scrape_mode: str = "sequential",
    profile_id: int = 0,
    user_id: int = None,
):
    page = 0
    consecutive_errors = 0
    MAX_ERRORS = 10
    
    while True:
        try:
            request = JobSearchRequest(
                query=query,
                location=location,
                profession_codes=profession_codes,
                page=page,
                page_size=20,
                workload_min=80,
                posted_within_days=profile.posted_within_days,
                radius_search=None,
            )
            
            if profile.max_distance and profile.latitude and profile.longitude:
                request.radius_search = RadiusSearchRequest(
                    distance=profile.max_distance,
                    geoPoint=GeoPoint(lat=profile.latitude, lon=profile.longitude)
                )
            
            response = await provider.search(request)
            
            if not response.items:
                add_log(profile_id, f"   📭 No more results for '{query}' (page {page})")
                break
            
            add_log(profile_id, f"   📄 Page {page+1}: found {len(response.items)} listings")
            
            new_jobs_count = 0
            
            for job_listing in response.items:
                job_url = job_listing.external_url
                jobroom_url = f"https://www.job-room.ch/offerten/stelle/{job_listing.id}" if job_listing.id else None
                effective_url = job_url or jobroom_url or ""
                
                # ── Local cache: check if THIS USER already has this job ──
                if effective_url:
                    existing_for_user = db.query(models.Job).filter(
                        models.Job.url == effective_url,
                        models.Job.user_id == user_id,
                    ).first()
                    if existing_for_user:
                        update_status(profile_id, jobs_duplicates=_get_field(profile_id, "jobs_duplicates") + 1)
                        continue
                
                # ── PHASE 1: Title pre-filter ──
                title = job_listing.title or ""
                relevance = llm.check_title_relevance(title, profile.role_description)
                
                if not relevance.get("relevant", True):
                    reason = relevance.get("reason", "")[:60]
                    add_log(profile_id, f"   ⏭️ Skipped: {title[:40]} — {reason}")
                    update_status(profile_id, jobs_skipped=_get_field(profile_id, "jobs_skipped") + 1)
                    continue
                
                # ── PHASE 2: Full analysis with curated metadata ──
                job_metadata = _extract_analysis_metadata(job_listing)
                
                analysis = llm.analyze_job_affinity(job_metadata, {
                    "role_description": profile.role_description,
                    "cv_content": profile.cv_content
                })
                
                # Extract application email
                application_email = None
                if job_listing.application and job_listing.application.email:
                    application_email = job_listing.application.email
                elif job_listing.contact and job_listing.contact.email:
                    application_email = job_listing.contact.email
                elif job_listing.company and job_listing.company.email:
                    application_email = job_listing.company.email
                
                pub_date = None
                if job_listing.publication and job_listing.publication.start_date:
                    try:
                        pub_date = datetime.fromisoformat(
                            job_listing.publication.start_date.replace("Z", "+00:00")
                        )
                    except (ValueError, TypeError):
                        pub_date = None
                
                new_job = models.Job(
                    user_id=user_id,
                    title=title,
                    company=job_listing.company.name if job_listing.company else "Unknown",
                    description=job_listing.descriptions[0].description if job_listing.descriptions else "",
                    location=job_listing.location.city if job_listing.location else "",
                    url=effective_url,
                    jobroom_url=jobroom_url,
                    application_email=application_email,
                    workload=f"{job_listing.employment.workload_min}-{job_listing.employment.workload_max}%" if job_listing.employment else "",
                    publication_date=pub_date,
                    is_scraped=True,
                    source_query=query,
                    affinity_score=analysis.get("affinity_score"),
                    affinity_analysis=analysis.get("affinity_analysis"),
                    worth_applying=analysis.get("worth_applying", False),
                )
                
                db.add(new_job)
                new_jobs_count += 1
                
                total_new = _get_field(profile_id, "jobs_new") + 1
                total_found = _get_field(profile_id, "jobs_found") + 1
                update_status(profile_id, jobs_new=total_new, jobs_found=total_found)
                
                score = analysis.get("affinity_score", 0)
                worth = " 💡" if analysis.get("worth_applying") else ""
                add_log(profile_id, f"   ✨ New: {title[:40]} ({job_listing.company.name if job_listing.company else '?'}) — {score}%{worth}")
            
            db.commit()
            
            if new_jobs_count == 0:
                pass

            page += 1
            consecutive_errors = 0
            
            if scrape_mode == "sequential":
                await asyncio.sleep(1)
            
        except Exception as e:
            logger.error(f"Error scraping page {page}: {e}")
            db.rollback()
            consecutive_errors += 1
            update_status(profile_id, errors=_get_field(profile_id, "errors") + 1)
            add_log(profile_id, f"   ❌ Error on page {page}: {str(e)[:80]}")
            if consecutive_errors >= MAX_ERRORS:
                add_log(profile_id, f"   ⛔ Stopping '{query}' after {MAX_ERRORS} consecutive errors")
                break
            await asyncio.sleep(5)


def _describe_search(config: dict) -> str:
    """Build a human-readable description of a search config."""
    t = config.get("type", "keyword")
    if t == "occupation":
        return f"[Occupation] {config.get('value', '?')}"
    elif t == "combined":
        return f"[Combined] {config.get('occupation', '?')} + {config.get('keywords', '?')}"
    else:
        return f"[Keyword] {config.get('value', '?')}"


def _get_field(profile_id: int, field: str) -> int:
    """Helper to get a numeric field from status."""
    from backend.services.search_status import get_status
    return get_status(profile_id).get(field, 0)
