import json
import logging
from typing import Dict, Any, Optional
from openai import OpenAI
from backend.core.config import settings
from backend.providers.llm.base import LLMProvider

logger = logging.getLogger(__name__)

class OpenAICompatibleProvider(LLMProvider):
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.LLM_API_KEY,
            base_url=settings.LLM_BASE_URL,
        )
        self.model = settings.LLM_MODEL

    def _clean_json(self, text: str) -> str:
        text = text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            lines = [l for l in lines[1:] if not l.strip() == "```"]
            text = "\n".join(lines)
        return text

    def generate_text(self, system_prompt: str, user_prompt: str, max_tokens: Optional[int] = None) -> str:
        params = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "max_tokens": max_tokens or settings.LLM_MAX_TOKENS,
            "temperature": settings.LLM_TEMPERATURE,
        }
        
        # Deepseek thinking mode specific adjustments
        if settings.LLM_PROVIDER == "deepseek" and settings.LLM_THINKING:
            # Deepseek reasoner might not support temperature
            params.pop("temperature", None)

        try:
            completion = self.client.chat.completions.create(**params)
            return completion.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"LLM Error: {e}")
            raise

    def generate_json(self, system_prompt: str, user_prompt: str, max_tokens: Optional[int] = None) -> Dict[str, Any]:
        params = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "max_tokens": max_tokens or settings.LLM_MAX_TOKENS,
            "temperature": settings.LLM_TEMPERATURE,
        }

        # JSON Mode
        if settings.LLM_PROVIDER != "deepseek" or not settings.LLM_THINKING:
             params["response_format"] = {"type": "json_object"}

        try:
            completion = self.client.chat.completions.create(**params)
            content = completion.choices[0].message.content or "{}"
            return json.loads(self._clean_json(content))
        except Exception as e:
            logger.error(f"LLM JSON Error: {e}")
            raise
