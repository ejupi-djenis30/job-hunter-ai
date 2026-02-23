from typing import List, Union, Any, Optional
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Job Hunter AI"
    
    # CORS
    CORS_ORIGINS: Optional[str] = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000"

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return []
        if self.CORS_ORIGINS.startswith("["):
            import json
            try:
                return json.loads(self.CORS_ORIGINS)
            except Exception:
                pass
        return [i.strip() for i in self.CORS_ORIGINS.split(",") if i.strip()]

    # Database
    DATABASE_URL: str = "sqlite:///./job_hunter.db"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    
    # Security
    SECRET_KEY: str = "changeme"

    @field_validator("SECRET_KEY")
    @classmethod
    def warn_default_secret_key(cls, v: str) -> str:
        if v == "changeme":
            import logging
            logging.warning("⚠️ USING DEFAULT INSECURE SECRET_KEY! Set SECRET_KEY in .env for production.")
        return v
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # ─── Global LLM (used as fallback for all steps) ───────────────────────────
    LLM_PROVIDER: str = "groq"
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = ""
    LLM_MODEL: str = "moonshotai/kimi-k2-instruct-0905"
    LLM_MAX_TOKENS: int = 16384
    LLM_TEMPERATURE: float = 0.7
    LLM_THINKING: bool = False
    LLM_THINKING_LEVEL: str = "MEDIUM"

    # ─── Per-step LLM overrides (all optional — empty string = use global) ─────
    # Step: PLAN  (generate_search_plan — typically benefits from creative model)
    LLM_PLAN_PROVIDER: str = ""
    LLM_PLAN_MODEL: str = ""
    LLM_PLAN_API_KEY: str = ""
    LLM_PLAN_BASE_URL: str = ""
    LLM_PLAN_TEMPERATURE: float = 0.0    # 0.0 = use global
    LLM_PLAN_MAX_TOKENS: int = 0          # 0 = use global

    # Step: RELEVANCE  (check_title_relevance — binary yes/no, cheap model works)
    LLM_RELEVANCE_PROVIDER: str = ""
    LLM_RELEVANCE_MODEL: str = ""
    LLM_RELEVANCE_API_KEY: str = ""
    LLM_RELEVANCE_BASE_URL: str = ""
    LLM_RELEVANCE_TEMPERATURE: float = 0.0
    LLM_RELEVANCE_MAX_TOKENS: int = 0

    # Step: MATCH  (analyze_job_match — deep reasoning, benefits from larger model)
    LLM_MATCH_PROVIDER: str = ""
    LLM_MATCH_MODEL: str = ""
    LLM_MATCH_API_KEY: str = ""
    LLM_MATCH_BASE_URL: str = ""
    LLM_MATCH_TEMPERATURE: float = 0.0
    LLM_MATCH_MAX_TOKENS: int = 0

    # Scraping
    JOB_ROOM_USER_AGENT: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

    # Logging
    LOG_LEVEL: str = "INFO"

    # Ollama Defaults
    OLLAMA_BASE_URL: str = "http://localhost:11434/v1"
    OLLAMA_MODEL: str = "llama3"

    model_config = SettingsConfigDict(
        case_sensitive=True, 
        env_file=".env", 
        extra="ignore"
    )

settings = Settings()
