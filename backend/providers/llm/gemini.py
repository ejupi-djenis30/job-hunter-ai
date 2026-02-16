import json
import logging
from typing import Dict, Any, Optional
from backend.core.config import settings
from backend.providers.llm.base import LLMProvider

logger = logging.getLogger(__name__)

class GeminiProvider(LLMProvider):
    def __init__(self):
        try:
            from google import genai
            from google.genai import types
            self.client = genai.Client(api_key=settings.LLM_API_KEY)
            self.types = types
        except ImportError:
            logger.error("google-genai package not installed")
            raise

    def get_config(self, json_mode: bool = False, max_tokens: Optional[int] = None):
        gen_config_kwargs = {
            "temperature": settings.LLM_TEMPERATURE,
            "max_output_tokens": max_tokens or settings.LLM_MAX_TOKENS,
            "top_p": 0.95, # Default
        }

        # Thinking
        if settings.LLM_THINKING_LEVEL != "OFF":
             gen_config_kwargs["thinking_config"] = self.types.ThinkingConfig(
                thinking_level=settings.LLM_THINKING_LEVEL,
            )

        if json_mode:
            gen_config_kwargs["response_mime_type"] = "application/json"
            
        return self.types.GenerateContentConfig(**gen_config_kwargs)

    def generate_text(self, system_prompt: str, user_prompt: str, max_tokens: Optional[int] = None) -> str:
        config = self.get_config(json_mode=False, max_tokens=max_tokens)
        config.system_instruction = system_prompt
        
        try:
            response = self.client.models.generate_content(
                model=settings.LLM_MODEL,
                contents=user_prompt,
                config=config,
            )
            return response.text or ""
        except Exception as e:
             logger.error(f"Gemini Error: {e}")
             raise

    def generate_json(self, system_prompt: str, user_prompt: str, max_tokens: Optional[int] = None) -> Dict[str, Any]:
        config = self.get_config(json_mode=True, max_tokens=max_tokens)
        config.system_instruction = system_prompt
        
        try:
            response = self.client.models.generate_content(
                model=settings.LLM_MODEL,
                contents=user_prompt,
                config=config,
            )
            return json.loads(response.text or "{}")
        except Exception as e:
             logger.error(f"Gemini JSON Error: {e}")
             raise
