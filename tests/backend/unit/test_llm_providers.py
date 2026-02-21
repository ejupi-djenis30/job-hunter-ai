import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from backend.providers.llm.base import LLMProvider
from backend.providers.llm.openai_compatible import OpenAICompatibleProvider

def test_openai_compatible_provider_initialization():
    with patch("backend.providers.llm.openai_compatible.settings.LLM_API_KEY", "dummy_key"):
        with patch("backend.providers.llm.openai_compatible.settings.LLM_MODEL", "llama3-8b"):
            provider = OpenAICompatibleProvider()
            assert provider.model == "llama3-8b"
            assert provider.client is not None

def test_openai_compatible_generate_text():
    # Setup mock
    with patch("backend.providers.llm.openai_compatible.settings.LLM_API_KEY", "dummy_key"):
        with patch("backend.providers.llm.openai_compatible.settings.LLM_MODEL", "llama3-8b"):
            provider = OpenAICompatibleProvider()

    # Mock the internal completion call
    with patch.object(provider.client.chat.completions, 'create') as mock_create:
        
        # Build mock response
        mock_message = MagicMock()
        mock_message.content = "Mocked LLM Response"
        
        mock_choice = MagicMock()
        mock_choice.message = mock_message
        
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        
        mock_create.return_value = mock_response
        
        text = provider.generate_text("System", "User")
        
        assert mock_create.called
        assert text == "Mocked LLM Response"

def test_llm_factory_returns_right_provider():
    from backend.providers.llm.factory import get_llm_provider

    with patch("backend.providers.llm.factory.settings.LLM_PROVIDER", "groq"):
        provider = get_llm_provider()
        assert isinstance(provider, OpenAICompatibleProvider)
