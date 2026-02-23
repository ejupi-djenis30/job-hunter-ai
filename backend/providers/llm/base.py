from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class LLMProvider(ABC):
    """Abstract base for all LLM providers.

    Concrete implementations receive all runtime parameters (api_key, model,
    temperature, …) via their constructor — they must NOT read from
    ``backend.core.config.settings`` directly.  Parameter resolution is
    handled by the **factory** layer (``get_provider_for_step``).
    """

    @property
    @abstractmethod
    def model_id(self) -> str:
        """Return a human-readable identifier: '<provider>/<model>'"""
        pass

    @abstractmethod
    def generate_text(self, system_prompt: str, user_prompt: str, max_tokens: Optional[int] = None) -> str:
        """Generate text from the LLM"""
        pass

    @abstractmethod
    def generate_json(self, system_prompt: str, user_prompt: str, max_tokens: Optional[int] = None) -> Dict[str, Any]:
        """Generate JSON from the LLM"""
        pass
