from backend.core.config import settings
from backend.providers.llm.base import LLMProvider
from backend.providers.llm.openai_compatible import OpenAICompatibleProvider
from backend.providers.llm.gemini import GeminiProvider

def get_llm_provider() -> LLMProvider:
    provider = settings.LLM_PROVIDER.lower()
    
    if provider == "gemini":
        return GeminiProvider()
    elif provider in ["groq", "deepseek", "openai"]:
        return OpenAICompatibleProvider()
    else:
        # Default fallback or error
        return OpenAICompatibleProvider()
