"""Language helpers for LLM prompts."""

LANGUAGE_NAMES: dict[str, str] = {
    "en": "English",
    "es": "Spanish",
    "zh": "Chinese (Simplified)",
    "ja": "Japanese",
    "pt": "Brazilian Portuguese",
}


def get_language_name(code: str) -> str:
    """Return a human-readable language name for a code."""
    return LANGUAGE_NAMES.get(code, "English")
