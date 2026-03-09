"""High-level resume improvement workflow."""

import json
import logging
from typing import Any

from app.models.improvement.schemas import (
    ImprovementSuggestion,
    ResumeImproveRequest,
    ResumeImproveResponse,
    ResumeRefineRequest,
    ResumeRefineResponse,
)
from app.models.refinement.schemas import RefinementConfig
from app.models.resume.schemas import ComprehensiveAnalysisData
from app.services.improver import (
    calculate_resume_diff,
    extract_job_keywords,
    generate_improvements,
    improve_resume,
)
from app.services.refiner import calculate_keyword_match, refine_resume

logger = logging.getLogger(__name__)


def _preserve_personal_info(
    original_data: ComprehensiveAnalysisData | dict[str, Any] | None,
    improved_data: dict[str, Any],
) -> tuple[dict[str, Any], list[str]]:
    warnings: list[str] = []

    if not original_data:
        warnings.append(
            "Original resume data unavailable - personal info may be AI-generated"
        )
        return improved_data, warnings

    if isinstance(original_data, ComprehensiveAnalysisData):
        original_dict = original_data.model_dump()
    else:
        original_dict = original_data

    original_info = {
        "name": original_dict.get("name"),
        "email": original_dict.get("email"),
        "contact": original_dict.get("contact"),
        "linkedin": original_dict.get("linkedin"),
        "github": original_dict.get("github"),
        "blog": original_dict.get("blog"),
        "portfolio": original_dict.get("portfolio"),
        "predicted_field": original_dict.get("predicted_field"),
    }

    if not any(value for value in original_info.values()):
        warnings.append("Original personal info missing or invalid")
        return improved_data, warnings

    result = json.loads(json.dumps(improved_data, ensure_ascii=True))
    result.update(
        {key: value for key, value in original_info.items() if value is not None}
    )
    return result, warnings


async def improve_resume_with_refinement(
    request: ResumeImproveRequest,
    *,
    llm,
) -> ResumeImproveResponse:
    if not request.resume_text.strip():
        return ResumeImproveResponse(
            success=False,
            message="Resume text cannot be empty",
            improved_resume=ComprehensiveAnalysisData(),
        )

    if not request.job_description.strip():
        return ResumeImproveResponse(
            success=False,
            message="Job description cannot be empty",
            improved_resume=ComprehensiveAnalysisData(),
        )

    job_keywords = request.job_keywords
    if not job_keywords:
        job_keywords = await extract_job_keywords(request.job_description, llm=llm)

    improved_data = await improve_resume(
        original_resume=request.resume_text,
        job_description=request.job_description,
        job_keywords=job_keywords,
        llm=llm,
        language=request.language,
        prompt_id=request.prompt_id,
    )

    warnings: list[str] = []
    improved_data, preserve_warnings = _preserve_personal_info(
        request.resume_data,
        improved_data,
    )
    warnings.extend(preserve_warnings)

    refinement_stats = None
    refinement_attempted = False
    refinement_successful = False

    if request.resume_data:
        try:
            initial_match = calculate_keyword_match(improved_data, job_keywords)
            refinement_attempted = True
            refinement_config = request.refinement_config or RefinementConfig()
            refinement_result = await refine_resume(
                initial_tailored=improved_data,
                master_resume=request.resume_data.model_dump(),
                job_description=request.job_description,
                job_keywords=job_keywords,
                llm=llm,
                config=refinement_config,
            )
            improved_data = refinement_result.refined_data
            refinement_stats = refinement_result.to_stats(initial_match)
            refinement_successful = True
        except Exception as error:
            logger.warning("Refinement failed: %s", error)
            warnings.append(f"Refinement failed: {error}")

    diff_summary = None
    detailed_changes = None
    if request.resume_data:
        try:
            diff_summary, detailed_changes = calculate_resume_diff(
                request.resume_data.model_dump(),
                improved_data,
            )
        except Exception as error:
            warnings.append(f"Could not calculate changes: {error}")

    improvements = [
        ImprovementSuggestion(
            suggestion=imp["suggestion"],
            lineNumber=imp.get("lineNumber"),
        )
        for imp in generate_improvements(job_keywords)
    ]

    return ResumeImproveResponse(
        improved_resume=ComprehensiveAnalysisData.model_validate(improved_data),
        improvements=improvements,
        diff_summary=diff_summary,
        detailed_changes=detailed_changes,
        refinement_stats=refinement_stats,
        warnings=warnings,
        refinement_attempted=refinement_attempted,
        refinement_successful=refinement_successful,
    )


async def refine_existing_resume(
    request: ResumeRefineRequest,
    *,
    llm,
) -> ResumeRefineResponse:
    if not request.job_keywords:
        job_keywords = await extract_job_keywords(request.job_description, llm=llm)
    else:
        job_keywords = request.job_keywords

    refinement_config = request.refinement_config or RefinementConfig()
    initial_match = calculate_keyword_match(request.tailored_resume, job_keywords)

    refinement_result = await refine_resume(
        initial_tailored=request.tailored_resume,
        master_resume=request.resume_data.model_dump(),
        job_description=request.job_description,
        job_keywords=job_keywords,
        llm=llm,
        config=refinement_config,
    )

    return ResumeRefineResponse(
        refined_resume=ComprehensiveAnalysisData.model_validate(
            refinement_result.refined_data
        ),
        refinement_stats=refinement_result.to_stats(initial_match),
    )
