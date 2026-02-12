from typing import Optional

from langchain_anthropic import ChatAnthropic
from langchain_core.language_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from app.core.settings import get_settings

settings = get_settings()

_llm_instance: Optional[BaseChatModel] = None
_faster_llm_instance: Optional[BaseChatModel] = None

MODEL_NAME = settings.MODEL_NAME
FASTER_MODEL_NAME = settings.FASTER_MODEL_NAME


def _supports_temperature(provider: str, model: str) -> bool:
    """Return whether passing `temperature` is supported for this model/provider combo."""
    model_lower = model.lower()

    if provider == "openai" and ("o1" in model_lower or "o3" in model_lower):
        return False

    return True


def create_llm(
    provider: str,
    model: str,
    api_key: Optional[str] = None,
    api_base: Optional[str] = None,
    temperature: float = 0.1,
) -> BaseChatModel:
    """
    Factory to create an LLM instance based on provider and configuration.
    """
    kwargs = {}
    if _supports_temperature(provider, model):
        kwargs["temperature"] = temperature

    if provider == "google" or provider == "gemini":
        key = api_key or settings.GOOGLE_API_KEY
        return ChatGoogleGenerativeAI(
            model=model,
            google_api_key=SecretStr(key) if key else None,
            **kwargs,
        )

    elif provider == "openai":
        key = api_key or settings.LLM_API_KEY
        return ChatOpenAI(
            model=model,
            api_key=SecretStr(key) if key else None,
            base_url=api_base or settings.LLM_API_BASE,
            **kwargs,
        )

    elif provider == "anthropic":
        key = api_key or settings.LLM_API_KEY
        return ChatAnthropic(
            model=model,
            anthropic_api_key=SecretStr(key) if key else None,
            anthropic_api_url=api_base
            or settings.LLM_API_BASE
            or "https://api.anthropic.com",
            **kwargs,
        )

    elif provider == "ollama":
        # Ollama doesn't need an API key, but takes base_url
        return ChatOllama(
            model=model,
            base_url=api_base or "http://localhost:11434",
            **kwargs,
        )

    elif provider == "openrouter":
        key = api_key or settings.LLM_API_KEY
        return ChatOpenAI(
            model=model,  # e.g. "anthropic/claude-4.5-sonnet"
            api_key=SecretStr(key) if key else None,
            base_url=api_base or "https://openrouter.ai/api/v1",
            **kwargs,
        )

    elif provider == "deepseek":
        key = api_key or settings.LLM_API_KEY
        return ChatOpenAI(
            model=model,
            api_key=SecretStr(key) if key else None,
            base_url=api_base or "https://api.deepseek.com",
            **kwargs,
        )

    else:
        # Default fallback to Google if unknown provider (or raise error?)
        print(f"Warning: Unknown provider '{provider}', falling back to Google.")
        key = settings.GOOGLE_API_KEY
        return ChatGoogleGenerativeAI(
            model=settings.MODEL_NAME,
            google_api_key=SecretStr(key) if key else None,
            **kwargs,
        )


def get_llm() -> Optional[BaseChatModel]:
    """
    Get or create the singleton instance of the main LLM (Server Default).
    Returns None if default provider API key is not set.
    """
    global _llm_instance

    if _llm_instance is not None:
        return _llm_instance

    # Default server configuration
    provider = settings.LLM_PROVIDER
    model = settings.LLM_MODEL or settings.MODEL_NAME

    # Basic check for Google key if using Google (legacy/default behavior)
    if (provider == "google" or provider == "gemini") and not settings.GOOGLE_API_KEY:
        print(
            "Warning: GOOGLE_API_KEY not found in settings. LLM functionality will be disabled."
        )
        return None

    try:
        _llm_instance = create_llm(
            provider=provider,
            model=model,
            api_key=settings.LLM_API_KEY,  # create_llm handles fallback to GOOGLE_API_KEY if this is None and provider is google
            api_base=settings.LLM_API_BASE,
            temperature=settings.MODEL_TEMPERATURE,
        )
        return _llm_instance

    except Exception as e:
        print(
            f"Error initializing Default LLM: {e}. LLM functionality will be disabled."
        )
        return None


def get_faster_llm() -> Optional[BaseChatModel]:
    """
    Get or create the singleton instance of the faster/lite LLM (Server Default).
    """
    global _faster_llm_instance

    if _faster_llm_instance is not None:
        return _faster_llm_instance

    # For faster LLM, we usually just want a faster model on the same provider
    provider = settings.LLM_PROVIDER
    # Use FASTER_MODEL_NAME if set, otherwise fallback to MODEL_NAME logic or assume gemini-lite
    model = settings.FASTER_MODEL_NAME

    try:
        _faster_llm_instance = create_llm(
            provider=provider,
            model=model,
            api_key=settings.LLM_API_KEY,
            api_base=settings.LLM_API_BASE,
            temperature=settings.MODEL_TEMPERATURE,
        )
        return _faster_llm_instance

    except Exception as e:
        print(
            f"Error initializing Faster LLM: {e}. LLM functionality will be disabled."
        )
        return None


# Backward compatibility proxies - REMOVED
# Use get_request_llm dependency instead
