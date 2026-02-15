"""Unit tests for the LLM service (mocked — no real API calls)."""

import json
import pytest
from unittest.mock import patch, MagicMock

from backend.services.llm import (
    _get_config,
    _parse_json,
    _build_params,
    generate_search_keywords,
    check_title_relevance,
    analyze_job_affinity,
)


class TestLLMConfig:
    """Test LLM configuration resolution."""

    def test_default_config(self):
        config = _get_config()
        assert config["provider"] in ("groq", "deepseek")
        assert "base_url" in config
        assert "model" in config
        assert "max_tokens" in config

    def test_config_has_provider(self):
        """Config provider should match the module-level LLM_PROVIDER."""
        from backend.services.llm import LLM_PROVIDER
        config = _get_config()
        assert config["provider"] == LLM_PROVIDER.lower()

    def test_config_has_base_url(self):
        config = _get_config()
        assert config["base_url"].startswith("https://")

    def test_config_types(self):
        config = _get_config()
        assert isinstance(config["max_tokens"], int)
        assert isinstance(config["temperature"], float)
        assert isinstance(config["top_p"], float)
        assert isinstance(config["thinking"], bool)


class TestJSONParsing:
    """Test JSON extraction from LLM responses."""

    def test_parse_clean_json(self):
        result = _parse_json('{"key": "value"}')
        assert result == {"key": "value"}

    def test_parse_json_with_whitespace(self):
        result = _parse_json('  \n  {"key": "value"}  \n  ')
        assert result == {"key": "value"}

    def test_parse_json_in_code_block(self):
        text = '```json\n{"key": "value"}\n```'
        result = _parse_json(text)
        assert result == {"key": "value"}

    def test_parse_invalid_json(self):
        with pytest.raises(json.JSONDecodeError):
            _parse_json("not json at all")

    def test_parse_json_array(self):
        result = _parse_json('[1, 2, 3]')
        assert result == [1, 2, 3]

    def test_parse_nested_json(self):
        text = '{"a": {"b": [1, 2]}}'
        result = _parse_json(text)
        assert result["a"]["b"] == [1, 2]


class TestBuildParams:
    """Test API parameter construction."""

    def _base_config(self, provider="groq"):
        return {
            "provider": provider,
            "model": "test-model",
            "max_tokens": 100,
            "temperature": 0.7,
            "top_p": 1.0,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0,
        }

    def test_json_mode_enabled(self):
        params = _build_params(self._base_config(), [{"role": "user", "content": "test"}])
        assert params["response_format"] == {"type": "json_object"}

    def test_json_mode_disabled(self):
        params = _build_params(self._base_config(), [{"role": "user", "content": "test"}], json_mode=False)
        assert "response_format" not in params

    def test_max_tokens_override(self):
        params = _build_params(self._base_config(), [], max_tokens_override=200)
        assert params["max_tokens"] == 200

    def test_deepseek_thinking_removes_temp(self):
        config = self._base_config("deepseek")
        config["thinking"] = True
        config["model"] = "deepseek-reasoner"
        params = _build_params(config, [])
        assert "temperature" not in params
        assert "top_p" not in params

    def test_includes_model(self):
        params = _build_params(self._base_config(), [])
        assert params["model"] == "test-model"

    def test_includes_messages(self):
        msgs = [{"role": "user", "content": "hello"}]
        params = _build_params(self._base_config(), msgs)
        assert params["messages"] == msgs


class TestGenerateSearchKeywords:
    """Test keyword generation with mocked LLM."""

    @patch("backend.services.llm._create_openai_client")
    def test_returns_searches(self, mock_create):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps({
            "searches": [
                {"type": "keyword", "value": "Python"},
                {"type": "occupation", "value": "Software Engineer"},
            ]
        })
        mock_response.choices[0].message.reasoning_content = None

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_create.return_value = mock_client

        result = generate_search_keywords({"role_description": "Python dev"})
        assert len(result) == 2
        assert result[0]["type"] == "keyword"

    @patch("backend.services.llm._create_openai_client")
    def test_strips_seniority_from_occupation(self, mock_create):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps({
            "searches": [
                {"type": "occupation", "value": "Senior Software Engineer"},
                {"type": "combined", "occupation": "Lead Developer", "keywords": "Python"},
            ]
        })
        mock_response.choices[0].message.reasoning_content = None

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_create.return_value = mock_client

        result = generate_search_keywords({"role_description": "dev"})
        assert result[0]["value"] == "Software Engineer"
        assert result[1]["occupation"] == "Developer"

    @patch("backend.services.llm._create_openai_client")
    def test_handles_error_gracefully(self, mock_create):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("API error")
        mock_create.return_value = mock_client

        result = generate_search_keywords({"role_description": "dev"})
        assert result == []


class TestCheckTitleRelevance:
    """Test title relevance pre-filter with mocked LLM."""

    @patch("backend.services.llm._create_openai_client")
    def test_relevant_title(self, mock_create):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps({
            "relevant": True, "reason": "Same field"
        })
        mock_response.choices[0].message.reasoning_content = None

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_create.return_value = mock_client

        result = check_title_relevance("Backend Developer", "Python developer")
        assert result["relevant"] is True

    @patch("backend.services.llm._create_openai_client")
    def test_irrelevant_title(self, mock_create):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps({
            "relevant": False, "reason": "Different field"
        })
        mock_response.choices[0].message.reasoning_content = None

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_create.return_value = mock_client

        result = check_title_relevance("Logistiker", "Python developer")
        assert result["relevant"] is False

    @patch("backend.services.llm._create_openai_client")
    def test_error_defaults_to_relevant(self, mock_create):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("API error")
        mock_create.return_value = mock_client

        result = check_title_relevance("Dev", "dev")
        assert result["relevant"] is True


class TestAnalyzeJobAffinity:
    """Test job affinity analysis with mocked LLM."""

    @patch("backend.services.llm._create_openai_client")
    def test_returns_analysis(self, mock_create):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps({
            "affinity_score": 75,
            "affinity_analysis": "Good match",
            "worth_applying": True,
            "worth_applying_reason": "Skills align",
        })
        mock_response.choices[0].message.reasoning_content = None

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_create.return_value = mock_client

        result = analyze_job_affinity(
            {"title": "Python Dev"},
            {"role_description": "Python developer"},
        )
        assert result["affinity_score"] == 75
        assert result["worth_applying"] is True

    @patch("backend.services.llm._create_openai_client")
    def test_clamps_score_to_bounds(self, mock_create):
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps({
            "affinity_score": 150,
            "affinity_analysis": "Over max",
            "worth_applying": False,
        })
        mock_response.choices[0].message.reasoning_content = None

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_create.return_value = mock_client

        result = analyze_job_affinity({}, {})
        assert result["affinity_score"] == 100

    @patch("backend.services.llm._create_openai_client")
    def test_error_returns_zero_score(self, mock_create):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("fail")
        mock_create.return_value = mock_client

        result = analyze_job_affinity({}, {})
        assert result["affinity_score"] == 0
        assert result["worth_applying"] is False
