"""
Service helper to generate a tailored resume using the LangGraph-based generator.

Environment:
- GOOGLE_API_KEY must be set (for Gemini via langchain-google-genai)
- Optional: TAVILY_API_KEY for web search enrichment (if available)
"""

import json
from json import JSONDecodeError
from typing import Optional

from langchain_core.language_models import BaseChatModel

from app.core.cache import build_cache_key, get_cached_json, set_cached_json
from app.models.schemas import (
    ComprehensiveAnalysisData,
    ComprehensiveAnalysisResponse,
)
from app.core.streaming import publish_event
from app.services.resume_generator import generate_tailored_resume


async def tailor_resume(
    resume_text: str,
    job_role: str,
    company_name: Optional[str] = None,
    company_website: Optional[str] = None,
    job_description: Optional[str] = None,
    llm: Optional[BaseChatModel] = None,
) -> ComprehensiveAnalysisResponse:
    """Generate a tailored resume analysis response from the provided context."""

    normalized_resume = resume_text.strip() if resume_text else ""

    if not normalized_resume:
        return ComprehensiveAnalysisResponse(
            success=False,
            message="Resume text cannot be empty",
            data=ComprehensiveAnalysisData(),
        )

    if not job_role or not job_role.strip():
        job_role = "Software Engineer"

    cache_material = json.dumps(
        {
            "resume_text": normalized_resume,
            "job_role": job_role,
            "company_name": company_name,
            "company_website": company_website,
            "job_description": job_description,
            "llm_model": getattr(llm, "model_name", "unknown") if llm else "none",
        },
        ensure_ascii=True,
        sort_keys=True,
    )
    cache_key = build_cache_key("tailored_resume", cache_material)
    cached = await get_cached_json(cache_key)
    if cached and isinstance(cached.get("data"), dict):
        return ComprehensiveAnalysisResponse(
            success=bool(cached.get("success", True)),
            message=str(cached.get("message", "")),
            data=ComprehensiveAnalysisData.model_validate(cached["data"]),
            cleaned_text=cached.get("cleaned_text"),
        )

    # run_resume_pipeline is async (per generator implementation) so await it
    raw_result = await generate_tailored_resume(
        resume=normalized_resume,
        job=job_role,
        company_name=company_name,
        company_website=company_website,
        jd=job_description,
        llm=llm,
    )

    if isinstance(raw_result, str):
        try:
            parsed_result = json.loads(raw_result)
        except JSONDecodeError:
            # LLM occasionally returns invalid JSON; surface a graceful error payload.
            return ComprehensiveAnalysisResponse(
                success=False,
                message="Failed to parse tailored resume output",
                data=ComprehensiveAnalysisData(),
                cleaned_text=raw_result,
            )

    elif isinstance(raw_result, dict):
        parsed_result = raw_result

    else:
        return ComprehensiveAnalysisResponse(
            success=False,
            message="Unexpected response type from resume generator",
            data=ComprehensiveAnalysisData(),
        )

    if isinstance(parsed_result, dict) and parsed_result.get("error"):
        return ComprehensiveAnalysisResponse(
            success=False,
            message=parsed_result.get("error", "Tailored resume generation failed"),
            data=ComprehensiveAnalysisData(),
            cleaned_text=parsed_result.get("raw"),
        )

    try:
        analysis = ComprehensiveAnalysisData.model_validate(parsed_result)  # type: ignore[attr-defined]

    except AttributeError:
        # Support older Pydantic versions if required.
        analysis = ComprehensiveAnalysisData.parse_obj(parsed_result)  # type: ignore[attr-defined]

    response = ComprehensiveAnalysisResponse(
        data=analysis,
    )
    payload = response.model_dump()
    await set_cached_json(cache_key, payload)
    await publish_event(
        "resume.tailored",
        {
            "job_role": job_role,
            "company_name": company_name or "",
        },
    )
    return response
