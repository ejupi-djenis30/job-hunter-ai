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
        
        # Strip markdown code blocks
        if text.startswith("```"):
            lines = text.split("\n")
            if len(lines) > 2 and lines[-1].strip().startswith("```"):
                text = "\n".join(lines[1:-1])
            else:
                lines = [l for l in lines[1:] if not l.strip() == "```"]
                text = "\n".join(lines)
                
        # Deepseek often wraps its thought process in <think> tags before the JSON.
        # Find the first { or [ to locate the JSON payload.
        start_idx_dict = text.find("{")
        start_idx_list = text.find("[")
        
        start_idx = -1
        if start_idx_dict != -1 and start_idx_list != -1:
            start_idx = min(start_idx_dict, start_idx_list)
        else:
            start_idx = max(start_idx_dict, start_idx_list)
            
        if start_idx > 0:
            text = text[start_idx:]
            
        # Clean up any trailing text after the JSON ends
        end_idx_dict = text.rfind("}")
        end_idx_list = text.rfind("]")
        
        end_idx = max(end_idx_dict, end_idx_list)
        if end_idx != -1 and end_idx < len(text) - 1:
            text = text[:end_idx + 1]
            
        return text.strip()

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
            message = completion.choices[0].message
            content = message.content or ""
            
            # Deepseek Reasoner support: Capture reasoning trace if available
            if getattr(message, "reasoning_content", None):
                logger.info(f"DeepSeek Reasoning Trace: {message.reasoning_content[:500]}...")
            
            return content
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
            clean_text = self._clean_json(content)
            try:
                return json.loads(clean_text)
            except Exception as parse_err:
                logger.error(f"Failed to parse JSON. Raw LLM output:\n{content}\nCleaned text:\n{clean_text}")
                raise parse_err
        except Exception as e:
            logger.error(f"LLM JSON Error: {e}")
            raise
