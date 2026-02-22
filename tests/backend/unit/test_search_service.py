import pytest
import asyncio
from unittest.mock import MagicMock, patch, AsyncMock
from backend.services.search_service import SearchService

@pytest.fixture
def mock_job_repo():
    return MagicMock()

@pytest.fixture
def mock_profile_repo():
    return MagicMock()

@pytest.fixture
def search_service(mock_job_repo, mock_profile_repo):
    return SearchService(mock_job_repo, mock_profile_repo)

@pytest.mark.asyncio
async def test_run_search_success(search_service, mock_profile_repo, mock_job_repo):
    # Setup mocks
    mock_profile = MagicMock()
    mock_profile.id = 1
    mock_profile.user_id = 42
    mock_profile.max_queries = 5
    mock_profile.is_stopped = False
    mock_profile.location_filter = "Zurich"
    mock_profile.workload_filter = None
    mock_profile.posted_within_days = 30
    mock_profile.contract_type = "any"
    mock_profile.latitude = None
    mock_profile.longitude = None
    mock_profile_repo.get.return_value = mock_profile
    
    mock_job_repo.get_user_job_identifiers.return_value = []
    
    mock_provider = AsyncMock()
    mock_provider.get_provider_info.return_value = {"name": "test"}
    mock_provider.search.return_value = MagicMock(items=[MagicMock(id="job1", source="test", external_url="url1")])
    
    with patch("backend.services.search_service.llm_service") as mock_llm, \
         patch("backend.services.search_service.init_status"), \
         patch("backend.services.search_service.add_log"), \
         patch("backend.services.search_service.update_status"), \
         patch("backend.services.search_service.JobRoomProvider", return_value=mock_provider), \
         patch("backend.services.search_service.SwissDevJobsProvider", return_value=mock_provider), \
         patch("backend.services.search_service.LocalDbProvider", return_value=mock_provider), \
         patch("backend.services.search_service.process_job_listing", return_value=True):
        
        mock_llm.generate_search_plan.return_value = [
            {"provider": "swissdevjobs", "query": "Software Engineer"}
        ]
        
        await search_service.run_search(1)
        
        mock_llm.generate_search_plan.assert_called_once()
        mock_provider.search.assert_awaited()
        # process_job_listing should be called once since we found 1 unique job
        # (Wait, swissdevjobs and job_room decorators return same mock_provider, 
        # but available_providers dict in search_service.run_search will have two entries pointing to it)
        # Actually in search_service.py it instantiates them: JobRoomProvider(), SwissDevJobsProvider()
        # So we mocked the classes themselves.

@pytest.mark.asyncio
async def test_run_search_stopped_by_user(search_service, mock_profile_repo):
    mock_profile = MagicMock()
    mock_profile.is_stopped = True
    mock_profile_repo.get.return_value = mock_profile
    
    with patch("backend.services.search_service.init_status"), \
         patch("backend.services.search_service.add_log"), \
         patch("backend.services.search_service.update_status") as mock_update:
        
        await search_service.run_search(1)
        # It should exit early after init_status but before LLM call? 
        # No, let's check code logic.
        # Line 58: profile is checked after LLM plan generation loop (Step 2)
        # Wait, Step 2 loop checks is_stopped.
        # So it should generate plan, then stop.

@pytest.mark.asyncio
async def test_run_search_no_plan(search_service, mock_profile_repo):
    mock_profile_repo.get.return_value = MagicMock()
    with patch("backend.services.search_service.llm_service") as mock_llm, \
         patch("backend.services.search_service.init_status"), \
         patch("backend.services.search_service.add_log"), \
         patch("backend.services.search_service.update_status") as mock_update:
        mock_llm.generate_search_plan.return_value = []
        await search_service.run_search(1)
        mock_update.assert_any_call(1, state="done", jobs_found=0, jobs_new=0)
