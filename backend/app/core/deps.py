from typing import Generator, Optional

from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.llm import get_faster_llm, get_llm
from app.core.settings import Settings, get_settings


def get_settings_dep() -> Settings:
    return get_settings()


def get_llm_dep() -> Optional[ChatGoogleGenerativeAI]:
    return get_llm()


def get_faster_llm_dep() -> Optional[ChatGoogleGenerativeAI]:
    return get_faster_llm()
