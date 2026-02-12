from typing import Optional

from fastapi import Request
from langchain_core.language_models import BaseChatModel

from app.core.llm import create_llm, get_faster_llm, get_llm
from app.core.settings import Settings, get_settings


def get_settings_dep() -> Settings:
    return get_settings()


def get_llm_dep() -> Optional[BaseChatModel]:
    return get_llm()


def get_faster_llm_dep() -> Optional[BaseChatModel]:
    return get_faster_llm()


def get_request_llm(request: Request) -> BaseChatModel:
    """FastAPI dependency that builds a per-request LLM instance.

    The frontend proxy routes attach these headers when the user has a custom
    LLM configuration stored in the database:
        X-LLM-Provider  (e.g. "openai", "anthropic", "google", ...)
        X-LLM-Model     (e.g. "gpt-4o", "claude-3.5-sonnet", ...)
        X-LLM-Key       (decrypted API key)
        X-LLM-Base      (optional custom base URL)

    When headers are absent we fall back to the server-default singleton.
    """
    provider = request.headers.get("X-LLM-Provider")
    model = request.headers.get("X-LLM-Model")
    api_key = request.headers.get("X-LLM-Key")
    api_base = request.headers.get("X-LLM-Base")

    if provider and model:
        return create_llm(
            provider=provider,
            model=model,
            api_key=api_key or None,
            api_base=api_base or None,
        )

    # No per-user config in headers -- use server default
    default = get_llm()
    if default is None:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=503,
            detail="LLM service is not configured. Please set up your LLM provider in account settings.",
        )
    return default
