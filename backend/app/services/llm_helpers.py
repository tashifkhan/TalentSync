"""Helpers for invoking LLMs and parsing JSON responses."""

import hashlib
import json
import logging
from typing import Any

from langchain_core.language_models import BaseChatModel

from app.core.cache import (
    build_cache_key,
    get_cached_json,
    get_cached_json_sync,
    set_cached_json,
    set_cached_json_sync,
)
from app.core.streaming import publish_event


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


def _llm_signature(llm: BaseChatModel | None) -> str:
    if llm is None:
        return "unknown"

    model_name = getattr(llm, "model_name", None)
    if isinstance(model_name, str) and model_name:
        return model_name

    fallback = str(llm.__class__.__name__)
    return fallback


def _cache_key(namespace: str, message: str, llm: BaseChatModel | None) -> str:
    signature = _llm_signature(llm)
    fingerprint = hashlib.sha256(message.encode("utf-8")).hexdigest()
    return build_cache_key(namespace, f"{signature}:{fingerprint}")


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

    key = _cache_key("llm_json_sync", message, llm)
    cached = get_cached_json_sync(key)
    if cached and isinstance(cached.get("result"), dict):
        return cached["result"]

    response = llm.invoke(message)
    raw_response = _extract_text_from_llm_result(response)
    parsed = parse_llm_json(raw_response)
    set_cached_json_sync(key, {"result": parsed})
    return parsed


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

    key = _cache_key("llm_json_async", message, llm)
    cached = await get_cached_json(key)
    if cached and isinstance(cached.get("result"), dict):
        return cached["result"]

    response = await llm.ainvoke(message)
    raw_response = _extract_text_from_llm_result(response)
    parsed = parse_llm_json(raw_response)
    await set_cached_json(key, {"result": parsed})
    await publish_event(
        "llm.json.completed",
        {
            "model": _llm_signature(llm),
            "prompt_chars": len(message),
        },
    )
    return parsed


async def llm_invoke_text_async(
    llm: BaseChatModel | None,
    message: str,
    *,
    cache_namespace: str = "llm_text_async",
) -> str:
    if llm is None:
        raise ValueError("LLM is required")

    key = _cache_key(cache_namespace, message, llm)
    cached = await get_cached_json(key)
    if cached and isinstance(cached.get("text"), str):
        return cached["text"]

    response = await llm.ainvoke(message)
    text = _extract_text_from_llm_result(response)
    await set_cached_json(key, {"text": text})
    await publish_event(
        "llm.text.completed",
        {
            "model": _llm_signature(llm),
            "prompt_chars": len(message),
        },
    )
    return text


def llm_invoke_text_sync(
    llm: BaseChatModel | None,
    message: str,
    *,
    cache_namespace: str = "llm_text_sync",
) -> str:
    if llm is None:
        raise ValueError("LLM is required")

    key = _cache_key(cache_namespace, message, llm)
    cached = get_cached_json_sync(key)
    if cached and isinstance(cached.get("text"), str):
        return cached["text"]

    response = llm.invoke(message)
    text = _extract_text_from_llm_result(response)
    set_cached_json_sync(key, {"text": text})
    return text


async def chain_invoke_text_async(
    chain: Any,
    payload: dict[str, Any],
    *,
    cache_namespace: str,
) -> str:
    serialized_payload = json.dumps(payload, ensure_ascii=True, sort_keys=True)
    key = build_cache_key(cache_namespace, serialized_payload)
    cached = await get_cached_json(key)
    if cached and isinstance(cached.get("text"), str):
        return cached["text"]

    response = await chain.ainvoke(payload)
    text = _extract_text_from_llm_result(response)
    await set_cached_json(key, {"text": text})
    await publish_event(
        "llm.chain.completed",
        {
            "namespace": cache_namespace,
            "payload_chars": len(serialized_payload),
        },
    )
    return text


def chain_invoke_text_sync(
    chain: Any,
    payload: dict[str, Any],
    *,
    cache_namespace: str,
) -> str:
    serialized_payload = json.dumps(payload, ensure_ascii=True, sort_keys=True)
    key = build_cache_key(cache_namespace, serialized_payload)
    cached = get_cached_json_sync(key)
    if cached and isinstance(cached.get("text"), str):
        return cached["text"]

    response = chain.invoke(payload)
    text = _extract_text_from_llm_result(response)
    set_cached_json_sync(key, {"text": text})
    return text
