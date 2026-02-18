"""Prompt templates and helpers for AI/LLM functionality."""

from .resume_refinement import (
    AI_PHRASE_BLACKLIST,
    AI_PHRASE_REPLACEMENTS,
    KEYWORD_INJECTION_PROMPT,
    VALIDATION_POLISH_PROMPT,
    build_keyword_injection_chain,
    build_validation_polish_chain,
)

__all__ = [
    "AI_PHRASE_BLACKLIST",
    "AI_PHRASE_REPLACEMENTS",
    "KEYWORD_INJECTION_PROMPT",
    "VALIDATION_POLISH_PROMPT",
    "build_keyword_injection_chain",
    "build_validation_polish_chain",
]
