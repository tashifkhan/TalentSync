"""Helpers for invoking LLMs and parsing JSON responses."""

import json
import logging
from typing import Any

from langchain_core.language_models import BaseChatModel


def _extract_text_from_llm_result(result: Any) -> str:
    if isinstance(result, str):
        return result

    content = getattr(result, "content", result)

    if isinstance(content, list):
        text_parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and "text" in item:
                text_parts.append(str(item["text"]))
            elif isinstance(item, str):
                text_parts.append(item)
            elif hasattr(item, "text"):
                text_parts.append(str(getattr(item, "text")))
        return "".join(text_parts)

    return str(content)


def parse_llm_json(raw_response: str) -> dict[str, Any]:
    if raw_response.strip().startswith("```json"):
        raw_response = (
            raw_response.strip().removeprefix("```json").removesuffix("```").strip()
        )

    try:
        parsed = json.loads(raw_response)
        if isinstance(parsed, dict):
            return parsed
        return {}
    except json.JSONDecodeError:
        start = raw_response.find("{")
        end = raw_response.rfind("}") + 1
        if start != -1 and end != -1 and end > start:
            try:
                parsed = json.loads(raw_response[start:end])
                if isinstance(parsed, dict):
                    return parsed
            except json.JSONDecodeError as error:
                logging.warning("Failed to parse JSON from LLM substring: %s", error)
        return {}


def llm_complete_json(
    llm: BaseChatModel | None,
    prompt: str,
    *,
    system_prompt: str | None = None,
    max_tokens: int = 4096,
    temperature: float = 0.1,
) -> dict[str, Any]:
    if llm is None:
        raise ValueError("LLM is required")

    if system_prompt:
        message = f"{system_prompt}\n\n{prompt}"
    else:
        message = prompt

    response = llm.invoke(message)
    raw_response = _extract_text_from_llm_result(response)
    return parse_llm_json(raw_response)


async def llm_complete_json_async(
    llm: BaseChatModel | None,
    prompt: str,
    *,
    system_prompt: str | None = None,
    max_tokens: int = 4096,
    temperature: float = 0.1,
) -> dict[str, Any]:
    if llm is None:
        raise ValueError("LLM is required")

    if system_prompt:
        message = f"{system_prompt}\n\n{prompt}"
    else:
        message = prompt

    response = await llm.ainvoke(message)
    raw_response = _extract_text_from_llm_result(response)
    return parse_llm_json(raw_response)
