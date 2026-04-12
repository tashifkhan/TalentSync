import asyncio
import base64
import hashlib
import logging
import os
import re

import fitz
import pymupdf4llm

from app.core.cache import (
    build_cache_key,
    get_cached_json,
    get_cached_json_sync,
    set_cached_json,
    set_cached_json_sync,
)
from app.core.settings import get_settings
from app.core.streaming import publish_event

settings = get_settings()
logger = logging.getLogger(__name__)


def _fallback_convert_to_text(file_bytes: bytes) -> str:
    """Fallback method to convert document bytes to plain text using Google GenAI.

    This fallback only works when the server-default provider is Google/Gemini,
    because it uses the raw Google GenAI SDK (not LangChain) with multimodal input.
    """
    from google import genai
    from google.genai import types

    provider = settings.LLM_PROVIDER
    if provider not in ("google", "gemini"):
        raise RuntimeError(
            f"PDF fallback conversion requires Google provider (current: {provider}). "
            "Upload a text-based resume instead."
        )

    api_key = settings.GOOGLE_API_KEY
    if not api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY is not configured; cannot perform fallback document conversion."
        )

    model_name = settings.MODEL_NAME
    client = genai.Client(api_key=api_key)
    prompt = (
        "You are a document conversion AI. Convert the following document to plain text.\n",
        "You don't talk about the conversion process, just provide the plain text output.\n",
        "MIND IT YOU ARE JUST SUPPOSED TO RETURN THE PLAIN OUTPUT.\n",
    )
    response = client.models.generate_content(
        model=model_name + "-lite",
        contents=[
            types.Part.from_bytes(
                data=file_bytes,
                mime_type="application/pdf",
            ),
            "".join(prompt),
        ],
    )
    cleaned_output = response.text

    return str(cleaned_output)


def _convert_document_to_markdown(file_bytes: bytes, filetype: str) -> str:
    """Render document bytes to Markdown using PyMuPDF for consistent parsing."""
    with fitz.open(stream=file_bytes, filetype=filetype) as doc:
        return pymupdf4llm.to_markdown(
            doc,
            force_text=True,
            ignore_images=False,
            ignore_graphics=False,
            page_separators=False,
        )


def _process_document_local(file_bytes: bytes, file_name: str | None) -> str | None:
    file_extension = os.path.splitext(file_name or "")[1].lower()
    try:
        if file_extension in {".txt", ".md"}:
            return file_bytes.decode()

        if file_extension in {".pdf", ".doc", ".docx"}:
            filetype = file_extension.lstrip(".")
            processed_txt = _convert_document_to_markdown(file_bytes, filetype)

            if not processed_txt.strip() and file_extension == ".pdf":
                return _fallback_convert_to_text(file_bytes)

            return processed_txt

        logger.warning(
            "Unsupported file type: %s. Please upload TXT, MD, PDF, or DOCX.",
            file_extension,
        )
        return None

    except Exception as e:
        logger.warning("Error processing file %s: %s", file_name, e)
        return None


def _build_document_cache_key(file_bytes: bytes, file_name: str | None) -> str:
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    safe_name = (file_name or "unknown").strip().lower()
    return build_cache_key("document", f"{safe_name}:{file_hash}")


def _process_document_with_celery(
    file_bytes: bytes, file_name: str | None
) -> str | None:
    try:
        from app.core.celery_app import celery_app, is_celery_enabled

        if not is_celery_enabled():
            return None

        payload_b64 = base64.b64encode(file_bytes).decode("ascii")
        task = celery_app.send_task(
            "app.tasks.document_tasks.process_document_task",
            args=[payload_b64, file_name or ""],
            queue=settings.CELERY_QUEUE_DOCUMENT,
        )
        result = task.get(timeout=settings.CELERY_TASK_TIMEOUT_SECONDS)
        if isinstance(result, str):
            return result
    except Exception as error:
        logger.debug("Celery document task failed: %s", error)

    return None


def process_document(file_bytes: bytes, file_name: str | None) -> str | None:
    if not file_bytes:
        return None

    cache_key = _build_document_cache_key(file_bytes, file_name)
    cached = get_cached_json_sync(cache_key)
    if cached and isinstance(cached.get("text"), str):
        return cached.get("text")

    result: str | None = None
    if settings.USE_CELERY_FOR_DOCUMENT_PROCESSING:
        result = _process_document_with_celery(file_bytes, file_name)

    if result is None:
        result = _process_document_local(file_bytes, file_name)

    if result:
        set_cached_json_sync(cache_key, {"text": result})

    return result


async def process_document_async(
    file_bytes: bytes, file_name: str | None
) -> str | None:
    if not file_bytes:
        return None

    cache_key = _build_document_cache_key(file_bytes, file_name)
    cached = await get_cached_json(cache_key)
    if cached and isinstance(cached.get("text"), str):
        return cached.get("text")

    result: str | None = None
    if settings.USE_CELERY_FOR_DOCUMENT_PROCESSING:
        result = await asyncio.to_thread(
            _process_document_with_celery,
            file_bytes,
            file_name,
        )

    if result is None:
        result = await asyncio.to_thread(_process_document_local, file_bytes, file_name)

    if result:
        await set_cached_json(cache_key, {"text": result})
        await publish_event(
            "document.processed",
            {
                "filename": file_name or "",
                "size_bytes": len(file_bytes),
            },
        )

    return result


def process_document_local(file_bytes: bytes, file_name: str | None) -> str | None:
    return _process_document_local(file_bytes, file_name)


def is_valid_resume(text: str) -> bool:
    if not text:
        return False

    resume_keywords = [
        "Experience",
        "Education",
        "Skills",
        "Profile",
        "Work History",
        "Projects",
        "Certifications",
    ]

    if any(re.search(keyword, text, re.I) for keyword in resume_keywords):
        return True

    return False


if __name__ == "__main__":
    # Example usage
    # Note: Absolute path in example usage is local to the developer's machine
    # We leave it as is or comment it out
    pass
