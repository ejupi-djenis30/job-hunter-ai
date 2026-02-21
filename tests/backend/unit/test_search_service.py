import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from backend.models import SearchProfile
from backend.models import Job
from backend.services.search_service import SearchService

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
    mock_job_repo = MagicMock()
    mock_profile_repo = MagicMock()
    service = SearchService(job_repo=mock_job_repo, profile_repo=mock_profile_repo)
    
    # We mock the entire db loading so it doesn't try to query SQLite
    service.profile_repo.get = lambda x: mock_profile

    # Mock the LLM query generation
    with patch("backend.services.llm_service.llm_service.generate_search_plan") as m_llm:
        m_llm.return_value = [{"query": "developer zurich", "provider": "job_room"}, {"query": "software engineer zürich", "provider": "swissdevjobs"}]
        
        # We explicitly call the internal method
        # Wait, the internals were refactored. The test called 'await service._generate_queries(mock_profile)'
        # Let's just call run_search and verify m_llm is called.
        await service.run_search(mock_profile.id)
        
        m_llm.assert_called_once()


@pytest.mark.asyncio
async def test_search_service_jobroom_scraping(mock_profile):
    mock_job_repo = MagicMock()
    mock_profile_repo = MagicMock()
    mock_profile_repo.get.return_value = mock_profile
    service = SearchService(job_repo=mock_job_repo, profile_repo=mock_profile_repo)

    # Mock the JobRoom Provider
    with patch("backend.providers.jobs.jobroom.client.JobRoomProvider.search", new_callable=AsyncMock) as m_jr:
        
        # Return dummy job listings from the scraper
        class MockListing:
            title = "Senior Dev"
            company = None
            external_url = "http://mock.com"
            location = None
            publication = None
            employment = None
            language_skills = []
            source = "job_room"
            id = "123"
            
        class MockResult:
            items = [MockListing()]
            
        m_jr.return_value = MockResult()
        
        # Calling the full workflow instead of _execute_jobroom_search since it's removed
        with patch("backend.services.llm_service.llm_service.generate_search_plan") as m_llm:
            m_llm.return_value = [{"query": "dev", "provider": "job_room"}]
            await service.run_search(mock_profile.id)
        
        m_jr.assert_called_once()


@pytest.mark.asyncio
async def test_search_service_deduplication(mock_profile):
    mock_job_repo = MagicMock()
    mock_profile_repo = MagicMock()
    mock_profile_repo.get.return_value = mock_profile
    service = SearchService(job_repo=mock_job_repo, profile_repo=mock_profile_repo)
    
    # Mock that the DB contains an existing job hash
    mock_job = MagicMock()
    mock_job.platform = "job_room"
    mock_job.platform_job_id = "123"
    mock_job.url = "DUMMY"
    service.job_repo.get_user_job_identifiers = lambda user_id: [mock_job]
    
    class MockListing:
        source = "job_room"
        id = "123"
        title = "Duplicate"
        company = None
        external_url = "DUMMY"
        location = None
        publication = None
        employment = None
        language_skills = []

    mock_listing = MockListing()
    
    class MockResult:
        items = [mock_listing]

    # Calling run_search and seeing if it avoids adding it
    with patch("backend.providers.jobs.jobroom.client.JobRoomProvider.search", new_callable=AsyncMock) as m_jr:
        m_jr.return_value = MockResult()
        with patch("backend.services.llm_service.llm_service.generate_search_plan") as m_llm:
            m_llm.return_value = [{"query": "dev", "provider": "job_room"}]
            await service.run_search(mock_profile.id)
    
    # job_repo.db.add should not have been called because job is duplicate
    mock_job_repo.db.add.assert_not_called()
