import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime
from backend.models import SearchProfile
from backend.models import Job

@pytest.fixture
def mock_profile():
    return SearchProfile(
        id=1,
        user_id=1,
        name="Mock Profile",
        role_description="Awesome Developer",
        max_queries=2,
        max_distance=50,
        latitude=47.0,
        longitude=8.0,
        cv_content="Mock CV",
        search_strategy="Mock Strategy",
        posted_within_days=30
    )


@pytest.mark.asyncio
async def test_search_service_generates_queries(mock_profile):
    service = SearchService(user_id=1, profile_id=1)
    
    # We mock the entire db loading so it doesn't try to query SQLite
    service.db = AsyncMock()
    service.db.query().filter().first.return_value = mock_profile

    # Mock the LLM query generation
    with patch("backend.services.llm_service.LLMService.generate_search_queries", new_callable=AsyncMock) as m_llm:
        m_llm.return_value = ["developer zurich", "software engineer zürich"]
        
        # We explicitly call the internal method
        queries = await service._generate_queries(mock_profile)
        
        m_llm.assert_called_once()
        assert len(queries) == 2
        assert "developer zurich" in queries


@pytest.mark.asyncio
async def test_search_service_jobroom_scraping(mock_profile):
    service = SearchService(user_id=1, profile_id=1)
    service.db = AsyncMock()

    # Mock the JobRoom Provider
    with patch("backend.providers.jobs.jobroom.client.JobRoomProvider.search_jobs_with_pagination", new_callable=AsyncMock) as m_jr:
        
        # Return dummy job listings from the scraper
        from backend.providers.jobs.jobroom.schemas import JobRoomListing, LocationMap
        mock_listing = JobRoomListing(
            id="123",
            title="Senior Dev",
            company="MockCorp",
            external_url="http://mock.com",
            location=LocationMap(city="Zurich"),
            publication_date="2024-01-01"
        )
        m_jr.return_value = ([mock_listing], 1)
        
        jobs_found = await service._execute_jobroom_search("dev", mock_profile)
        
        m_jr.assert_called_once()
        assert len(jobs_found) == 1
        assert jobs_found[0].title == "Senior Dev"


@pytest.mark.asyncio
async def test_search_service_deduplication(mock_profile):
    service = SearchService(user_id=1, profile_id=1)
    service.db = AsyncMock()
    
    # Mock that the DB contains an existing job hash
    service.db.query().filter().first.return_value = True # Meaning duplicate exists
    
    from backend.providers.jobs.jobroom.schemas import JobRoomListing
    mock_listing = JobRoomListing(
        id="123", title="Duplicate", company="A", external_url="DUMMY"
    )
    
    # Create the internal mapping explicitly for duplicate testing
    service.duplicate_count = 0
    unique = await service._filter_duplicates([mock_listing])
    
    assert len(unique) == 0
    assert service.duplicate_count == 1
