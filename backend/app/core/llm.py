from typing import Optional

from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.settings import get_settings

settings = get_settings()

_llm_instance: Optional[ChatGoogleGenerativeAI] = None
_faster_llm_instance: Optional[ChatGoogleGenerativeAI] = None

MODEL_NAME = settings.MODEL_NAME
FASTER_MODEL_NAME = settings.FASTER_MODEL_NAME


def get_llm() -> Optional[ChatGoogleGenerativeAI]:
    """
    Get or create the singleton instance of the main LLM.
    Returns None if GOOGLE_API_KEY is not set.
    """
    global _llm_instance

    if _llm_instance is not None:
        return _llm_instance

    if not settings.GOOGLE_API_KEY:
        print(
            "Warning: GOOGLE_API_KEY not found in settings. LLM functionality will be disabled."
        )
        return None

    try:
        _llm_instance = ChatGoogleGenerativeAI(
            model=settings.MODEL_NAME,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=settings.MODEL_TEMPERATURE,
        )
        return _llm_instance

    except Exception as e:
        print(
            f"Error initializing Google Generative AI: {e}. LLM functionality will be disabled."
        )
        return None


def get_faster_llm() -> Optional[ChatGoogleGenerativeAI]:
    """
    Get or create the singleton instance of the faster/lite LLM.
    Returns None if GOOGLE_API_KEY is not set.
    """
    global _faster_llm_instance

    if _faster_llm_instance is not None:
        return _faster_llm_instance

    if not settings.GOOGLE_API_KEY:
        # Warning already logged by get_llm or similar checks
        return None

    try:
        _faster_llm_instance = ChatGoogleGenerativeAI(
            model=settings.FASTER_MODEL_NAME,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=settings.MODEL_TEMPERATURE,
        )
        return _faster_llm_instance

    except Exception as e:
        print(
            f"Error initializing Faster Google Generative AI: {e}. LLM functionality will be disabled."
        )
        return None


# Backward compatibility proxies
llm = get_llm()
faster_llm = get_faster_llm()
