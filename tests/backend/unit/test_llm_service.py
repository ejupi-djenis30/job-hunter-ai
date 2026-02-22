import pytest
from unittest.mock import MagicMock, patch
from backend.services.llm_service import LLMService

@pytest.fixture
def mock_provider():
    return MagicMock()

@pytest.fixture
def llm_service(mock_provider):
    with patch("backend.services.llm_service.get_llm_provider", return_value=mock_provider):
        return LLMService()

def test_generate_search_plan_success(llm_service, mock_provider):
    mock_provider.generate_json.return_value = {
        "searches": [
            {"provider": "swissdevjobs", "language": "en", "type": "occupation", "query": "Software Engineer"}
        ]
    }
    
    profile = {"role_description": "Dev", "search_strategy": "Be aggressive", "cv_content": "Experienced"}
    providers = [{"name": "swissdevjobs", "description": "IT jobs"}]
    
    plan = llm_service.generate_search_plan(profile, providers, max_queries=1)
    
    assert len(plan) == 1
    assert plan[0]["query"] == "Software Engineer"
    mock_provider.generate_json.assert_called_once()

def test_generate_search_plan_error(llm_service, mock_provider):
    mock_provider.generate_json.side_effect = Exception("LLM Error")
    plan = llm_service.generate_search_plan({}, [])
    assert plan == []

def test_check_title_relevance(llm_service, mock_provider):
    mock_provider.generate_json.return_value = {"relevant": True, "reason": "Good match"}
    res = llm_service.check_title_relevance("Chef", "Cook")
    assert res["relevant"] is True
    mock_provider.generate_json.assert_called_once()

def test_analyze_job_match(llm_service, mock_provider):
    mock_provider.generate_json.return_value = {
        "affinity_score": 90,
        "affinity_analysis": "Perfect match",
        "worth_applying": True
    }
    res = llm_service.analyze_job_match({"title": "Dev"}, {"role_description": "Dev"})
    assert res["affinity_score"] == 90
    assert res["worth_applying"] is True
