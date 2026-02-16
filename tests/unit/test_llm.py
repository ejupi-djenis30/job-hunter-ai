"""Unit tests for the LLM service (mocked — no real API calls)."""

import pytest
from unittest.mock import patch, MagicMock

from backend.services.llm_service import LLMService


class TestLLMService:
    """Test LLM service methods."""

    @pytest.fixture
    def mock_provider(self):
        return MagicMock()

    @pytest.fixture
    def llm_service(self, mock_provider):
        with patch("backend.services.llm_service.get_llm_provider", return_value=mock_provider):
            return LLMService()

    def test_generate_search_keywords(self, llm_service, mock_provider):
        """Should return searches from provider."""
        mock_provider.generate_json.return_value = {
            "searches": [
                {"type": "keyword", "value": "Python"},
                {"type": "occupation", "value": "Software Engineer"}
            ]
        }
        
        result = llm_service.generate_search_keywords({"role_description": "dev"})
        
        assert len(result) == 2
        assert result[0]["value"] == "Python"
        mock_provider.generate_json.assert_called_once()

    def test_generate_search_keywords_error(self, llm_service, mock_provider):
        """Should handle error gracefully."""
        mock_provider.generate_json.side_effect = Exception("API Error")
        
        result = llm_service.generate_search_keywords({"role_description": "dev"})
        
        assert result == []

    def test_check_title_relevance(self, llm_service, mock_provider):
        """Should return relevance from provider."""
        mock_provider.generate_json.return_value = {"relevant": True, "reason": "Match"}
        
        result = llm_service.check_title_relevance("Dev", "dev")
        
        assert result["relevant"] is True
        mock_provider.generate_json.assert_called_once()
    
    def test_check_title_relevance_error(self, llm_service, mock_provider):
        """Should default to True on error."""
        mock_provider.generate_json.side_effect = Exception("API Error")
        
        result = llm_service.check_title_relevance("Dev", "dev")
        
        assert result["relevant"] is True
        assert "Error" in result["reason"]

    def test_analyze_job_match(self, llm_service, mock_provider):
        """Should return affinity analysis."""
        mock_provider.generate_json.return_value = {
            "affinity_score": 80,
            "affinity_analysis": "Good",
            "worth_applying": True
        }
        
        result = llm_service.analyze_job_match({"title": "Job"}, {"role": "Dev"})
        
        assert result["affinity_score"] == 80
        assert result["worth_applying"] is True

    def test_analyze_job_match_error(self, llm_service, mock_provider):
        """Should return zero score on error."""
        mock_provider.generate_json.side_effect = Exception("API Error")
        
        result = llm_service.analyze_job_match({}, {})
        
        assert result["affinity_score"] == 0
        assert result["worth_applying"] is False
