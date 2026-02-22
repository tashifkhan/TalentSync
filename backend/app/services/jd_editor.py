"""JD-targeted resume editing service."""

import json
import logging
from typing import Any

from app.data.prompt.jd_editor import (
    COMPUTE_JD_CHANGES_PROMPT,
    EDIT_RESUME_FOR_JD_PROMPT,
    EXTRACT_JD_KEYWORDS_PROMPT,
    SCORE_RESUME_AGAINST_JD_PROMPT,
)
from app.data.prompt.resume_improvement import RESUME_SCHEMA
from app.models.improvement.schemas import ResumeDiffSummary, ResumeFieldDiff
from app.models.jd_editor.schemas import JDEditChange, JDEditRequest, JDEditResponse
from app.models.resume.schemas import ComprehensiveAnalysisData
from app.services.improver import calculate_resume_diff
from app.services.language import get_language_name
from app.services.llm_helpers import llm_complete_json_async

logger = logging.getLogger(__name__)


async def _extract_jd_keywords(job_description: str, *, llm) -> dict[str, Any]:
    prompt = EXTRACT_JD_KEYWORDS_PROMPT.format(job_description=job_description)
    return await llm_complete_json_async(
        llm,
        prompt,
        system_prompt="You are an expert job description analyzer. Output only valid JSON.",
    )


async def _score_resume(
    resume_data: dict[str, Any],
    job_keywords: dict[str, Any],
    *,
    llm,
) -> dict[str, Any]:
    prompt = SCORE_RESUME_AGAINST_JD_PROMPT.format(
        job_keywords=json.dumps(job_keywords, ensure_ascii=True),
        resume_json=json.dumps(resume_data, ensure_ascii=True),
    )
    try:
        return await llm_complete_json_async(
            llm,
            prompt,
            system_prompt="You are a resume scoring expert. Output only valid JSON.",
        )
    except Exception as err:
        logger.warning("Could not score resume: %s", err)
        return {"score": None, "matched_keywords": [], "missing_required": []}


async def _edit_resume(
    resume_data: dict[str, Any],
    job_description: str,
    job_keywords: dict[str, Any],
    company_name: str,
    language: str,
    *,
    llm,
) -> dict[str, Any]:
    output_language = get_language_name(language)
    prompt = EDIT_RESUME_FOR_JD_PROMPT.format(
        job_description=job_description,
        job_keywords=json.dumps(job_keywords, ensure_ascii=True),
        company_name=company_name or "the company",
        original_resume=json.dumps(resume_data, ensure_ascii=True),
        schema=RESUME_SCHEMA,
        output_language=output_language,
    )
    result = await llm_complete_json_async(
        llm,
        prompt,
        system_prompt="You are an expert resume editor. Output only valid JSON.",
        max_tokens=8192,
    )
    return result


async def _compute_changes(
    original_data: dict[str, Any],
    edited_data: dict[str, Any],
    job_description: str,
    *,
    llm,
) -> list[JDEditChange]:
    prompt = COMPUTE_JD_CHANGES_PROMPT.format(
        original_resume=json.dumps(original_data, ensure_ascii=True),
        edited_resume=json.dumps(edited_data, ensure_ascii=True),
        job_description=job_description,
    )
    try:
        raw = await llm_complete_json_async(
            llm,
            prompt,
            system_prompt="You are a careful resume diff analyzer. Output only a valid JSON array.",
        )
        if isinstance(raw, list):
            changes: list[JDEditChange] = []
            for item in raw:
                if not isinstance(item, dict):
                    continue
                changes.append(
                    JDEditChange(
                        field=str(item.get("field", "")),
                        field_type=str(item.get("field_type", "description")),
                        original=str(item.get("original", "")),
                        edited=str(item.get("edited", "")),
                        reason=str(item.get("reason", "")),
                    )
                )
            return changes
    except Exception as err:
        logger.warning("Could not compute changes: %s", err)
    return []


def _preserve_personal_info(
    original: dict[str, Any],
    edited: dict[str, Any],
) -> dict[str, Any]:
    personal_fields = [
        "name",
        "email",
        "contact",
        "linkedin",
        "github",
        "blog",
        "portfolio",
    ]
    result = dict(edited)
    for field in personal_fields:
        original_val = original.get(field)
        if original_val is not None:
            result[field] = original_val
    return result


async def edit_resume_for_jd(
    request: JDEditRequest,
    *,
    llm,
) -> JDEditResponse:
    warnings: list[str] = []

    if not request.resume_text.strip() and not request.resume_data:
        return JDEditResponse(
            success=False,
            message="Resume data cannot be empty",
            edited_resume=ComprehensiveAnalysisData(),
        )

    job_description = request.job_description.strip()

    # Resolve JD from URL if text is not provided
    if not job_description and request.jd_url:
        try:
            from app.agents.web_content_agent import return_markdown

            fetched = await return_markdown(request.jd_url)
            if fetched:
                job_description = fetched
        except Exception as err:
            warnings.append(f"Could not fetch JD from URL: {err}")

    if not job_description:
        return JDEditResponse(
            success=False,
            message="Job description is required (provide text or a valid URL)",
            edited_resume=ComprehensiveAnalysisData(),
        )

    original_dict = request.resume_data.model_dump()

    # Step 1: Extract JD keywords
    job_keywords: dict[str, Any] = {}
    try:
        job_keywords = await _extract_jd_keywords(job_description, llm=llm)
    except Exception as err:
        warnings.append(f"Keyword extraction failed: {err}")

    # Step 2: Score the resume before editing
    before_score_result = await _score_resume(original_dict, job_keywords, llm=llm)
    ats_score_before: int | None = before_score_result.get("score")
    keywords_missing_before: list[str] = before_score_result.get("missing_required", [])

    # Step 3: Edit the resume for the JD
    edited_dict = await _edit_resume(
        resume_data=original_dict,
        job_description=job_description,
        job_keywords=job_keywords,
        company_name=request.company_name or "",
        language=request.language,
        llm=llm,
    )

    # Step 4: Preserve personal info (LLM must not alter identity fields)
    edited_dict = _preserve_personal_info(original_dict, edited_dict)

    # Step 5: Score the resume after editing
    after_score_result = await _score_resume(edited_dict, job_keywords, llm=llm)
    ats_score_after: int | None = after_score_result.get("score")
    keywords_addressed: list[str] = after_score_result.get("matched_keywords", [])
    keywords_missing: list[str] = after_score_result.get(
        "missing_required", keywords_missing_before
    )

    # Step 6: Compute human-readable change list
    changes = await _compute_changes(
        original_data=original_dict,
        edited_data=edited_dict,
        job_description=job_description,
        llm=llm,
    )

    # Step 7: Compute structured diff for frontend diff viewer
    diff_summary: ResumeDiffSummary | None = None
    detailed_changes: list[ResumeFieldDiff] | None = None
    try:
        diff_summary, detailed_changes = calculate_resume_diff(
            original_dict, edited_dict
        )
    except Exception as err:
        warnings.append(f"Could not calculate diff: {err}")

    return JDEditResponse(
        edited_resume=ComprehensiveAnalysisData.model_validate(edited_dict),
        changes=changes,
        diff_summary=diff_summary,
        detailed_changes=detailed_changes,
        ats_score_before=ats_score_before,
        ats_score_after=ats_score_after,
        keywords_addressed=keywords_addressed,
        keywords_missing=keywords_missing,
        warnings=warnings,
    )
