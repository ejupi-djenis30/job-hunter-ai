import logging
import json
from typing import Dict, Any, Optional
from openai import OpenAI
from backend.core.config import settings
from backend.providers.llm.openai_compatible import OpenAICompatibleProvider

logger = logging.getLogger(__name__)

class OllamaProvider(OpenAICompatibleProvider):
    def __init__(self):
        # Override to use Ollama-specific settings if available, or fall back to generic LLM settings
        # If user set LLM_BASE_URL (generic), use it. otherwise use OLLAMA_BASE_URL default
        base_url = settings.LLM_BASE_URL if settings.LLM_BASE_URL else settings.OLLAMA_BASE_URL
        api_key = settings.LLM_API_KEY if settings.LLM_API_KEY else "ollama"
        self.model = settings.LLM_MODEL if settings.LLM_MODEL else settings.OLLAMA_MODEL
        
        self.client = OpenAI(
            api_key=api_key,
            base_url=base_url,
        )
        logger.info(f"Initialized OllamaProvider with model={self.model}, base_url={base_url}")
