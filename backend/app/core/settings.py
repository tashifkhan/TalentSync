from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # API Configuration
    APP_NAME: str = "TalentSync Normies API"
    APP_VERSION: str = "1.5.8"
    DEBUG: bool = False

    # LLM Configuration
    GOOGLE_API_KEY: Optional[str] = None
    MODEL_NAME: str = "gemini-2.5-flash"
    FASTER_MODEL_NAME: str = "gemini-2.5-flash-lite"
    MODEL_TEMPERATURE: float = 0.1

    # External Services
    TAVILY_API_KEY: Optional[str] = None

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    # Interview Configuration
    INTERVIEW_MAX_QUESTIONS: int = 20
    INTERVIEW_DEFAULT_QUESTIONS: int = 5
    INTERVIEW_CODE_EXECUTION_TIMEOUT: int = 10  # seconds
    INTERVIEW_SESSION_MAX_AGE_HOURS: int = 24


@lru_cache
def get_settings() -> Settings:
    return Settings()
