import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime
from backend.services.search.search_executor import process_job_listing
from backend.models import Job, ScrapedJob

@pytest.mark.asyncio
async def test_process_job_listing_relevant():
    # Setup mocks
    mock_listing = MagicMock()
    mock_listing.title = "Software Engineer"
    mock_listing.descriptions = [MagicMock(description="Cool job")]
    mock_listing.location = MagicMock(city="Zurich")
    mock_listing.employment = MagicMock(workload_min=80, workload_max=100)
    mock_listing.application = MagicMock(form_url="http://apply", email="hr@company.com")
    mock_listing.source = "swissdevjobs"
    mock_listing.id = "123"
    mock_listing.publication = MagicMock(start_date="2025-01-01")
    mock_listing.company = MagicMock(name="Tech Swiss")
    mock_listing.raw_data = {"raw": "data"}
    mock_listing.language_skills = []

    profile_dict = {
        "id": 1,
        "user_id": 42,
        "role_description": "Dev",
        "latitude": None,
        "longitude": None,
        "cv_content": "",
    }

    mock_db = MagicMock()
    # Simulate that no existing ScrapedJob is found (single-filter query: .query().filter(*args).first())
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    with patch("backend.services.search.search_executor.llm_service") as mock_llm:
        mock_llm.check_title_relevance.return_value = {"relevant": True}
        mock_llm.analyze_job_match.return_value = {
            "affinity_score": 85,
            "affinity_analysis": "Great",
            "worth_applying": True
        }
        
        result = await process_job_listing(mock_listing, profile_dict, mock_db)
        
        assert result is True
        # Now we expect two add() calls: one for ScrapedJob, one for Job
        assert mock_db.add.call_count == 2
        
        # The first add() is for ScrapedJob
        scraped_job = mock_db.add.call_args_list[0][0][0]
        assert isinstance(scraped_job, ScrapedJob)
        assert scraped_job.title == "Software Engineer"
        
        # The second add() is for Job
        job = mock_db.add.call_args_list[1][0][0]
        assert isinstance(job, Job)
        assert job.affinity_score == 85

@pytest.mark.asyncio
async def test_process_job_listing_irrelevant():
    mock_listing = MagicMock(title="Chef")
    profile_dict = {"role_description": "Dev"}
    mock_db = MagicMock()
    
    with patch("backend.services.search.search_executor.llm_service") as mock_llm:
        mock_llm.check_title_relevance.return_value = {"relevant": False}
        
        result = await process_job_listing(mock_listing, profile_dict, mock_db)
        
        assert result is False
        mock_db.add.assert_not_called()

@pytest.mark.asyncio
async def test_process_job_listing_jobroom_fallback_url():
    mock_listing = MagicMock()
    mock_listing.title = "JobRoom Job"
    mock_listing.source = "job_room"
    mock_listing.id = "JR999"
    mock_listing.external_url = None
    mock_listing.descriptions = []
    mock_listing.location = None
    mock_listing.employment = None
    mock_listing.application = None
    mock_listing.publication = None
    mock_listing.company = None
    mock_listing.language_skills = []

    profile_dict = {"id": 1, "user_id": 1, "role_description": "Dev", "latitude": None, "longitude": None}
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    with patch("backend.services.search.search_executor.llm_service") as mock_llm:
        mock_llm.check_title_relevance.return_value = {"relevant": True}
        mock_llm.analyze_job_match.return_value = {"affinity_score": 0}
        
        await process_job_listing(mock_listing, profile_dict, mock_db)
        
        # ScrapedJob should be the first add call with the fallback URL
        scraped_job = mock_db.add.call_args_list[0][0][0]
        assert scraped_job.external_url == "https://www.job-room.ch/job-search/JR999"

@pytest.mark.asyncio
async def test_process_job_listing_with_distance():
    mock_listing = MagicMock()
    mock_listing.title = "Distance Job"
    mock_listing.location = MagicMock()
    mock_listing.location.coordinates = MagicMock(lat=47.37, lon=8.54)
    mock_listing.descriptions = []
    mock_listing.source = "test"
    mock_listing.id = "1"
    mock_listing.language_skills = []
    mock_listing.employment = None
    mock_listing.application = None
    mock_listing.publication = None
    mock_listing.company = None

    profile_dict = {
        "id": 1,
        "user_id": 1,
        "role_description": "Dev",
        "latitude": 46.20,
        "longitude": 6.14,
    }
    
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    with patch("backend.services.search.search_executor.llm_service") as mock_llm:
        mock_llm.check_title_relevance.return_value = {"relevant": True}
        mock_llm.analyze_job_match.return_value = {"affinity_score": 0}
        
        await process_job_listing(mock_listing, profile_dict, mock_db)
        
        # Job is the second add call
        job = mock_db.add.call_args_list[1][0][0]
        assert job.distance_km is not None
        assert job.distance_km > 0
