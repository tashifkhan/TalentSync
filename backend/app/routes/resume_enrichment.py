"""AI-powered resume enrichment endpoints using structured resume data."""

from fastapi import APIRouter, Depends, HTTPException
from langchain_core.language_models import BaseChatModel

from app.core.deps import get_request_llm
from app.models.enrichment.schemas import (
    AnalyzeRequest,
    AnalysisResponse,
    ApplyEnhancementsRequest,
    ApplyRegeneratedRequest,
    EnhanceRequest,
    EnhancementPreview,
    RefineEnhancementsRequest,
    RegenerateRequest,
    RegenerateResponse,
)
from app.services.enrichment import (
    analyze_resume_enrichment,
    apply_enhancements_to_resume,
    apply_regenerated_items,
    generate_enhancements_preview,
    refine_enhancements,
    regenerate_items,
)

router = APIRouter()


@router.post(
    "/resume/enrichment/analyze",
    response_model=AnalysisResponse,
    summary="Analyze resume items for enrichment.",
)
async def analyze_resume(
    resume: AnalyzeRequest,
    llm: BaseChatModel = Depends(get_request_llm),
) -> AnalysisResponse:
    return await analyze_resume_enrichment(resume.resume_data.model_dump(), llm=llm)


@router.post(
    "/resume/enrichment/enhance",
    response_model=EnhancementPreview,
    summary="Generate enhanced descriptions from answers.",
)
async def generate_enhancements(
    request: EnhanceRequest,
    llm: BaseChatModel = Depends(get_request_llm),
) -> EnhancementPreview:
    return await generate_enhancements_preview(
        resume_data=request.resume_data.model_dump(),
        request=request,
        llm=llm,
    )


@router.post(
    "/resume/enrichment/refine",
    response_model=EnhancementPreview,
    summary="Refine rejected enhancements using user feedback.",
)
async def refine_rejected_enhancements(
    request: RefineEnhancementsRequest,
    llm: BaseChatModel = Depends(get_request_llm),
) -> EnhancementPreview:
    return await refine_enhancements(
        resume_data=request.resume_data.model_dump(),
        request=request,
        llm=llm,
    )


@router.post(
    "/resume/enrichment/apply",
    summary="Apply enhancements to resume data.",
)
async def apply_enhancements(
    request: ApplyEnhancementsRequest,
) -> dict:
    updated = apply_enhancements_to_resume(request.resume_data.model_dump(), request)
    return {
        "message": "Enhancements applied successfully",
        "updated_resume": updated,
    }


@router.post(
    "/resume/enrichment/regenerate",
    response_model=RegenerateResponse,
    summary="Regenerate selected resume items.",
)
async def regenerate_resume_items(
    request: RegenerateRequest,
    llm: BaseChatModel = Depends(get_request_llm),
) -> RegenerateResponse:
    return await regenerate_items(request, llm=llm)


@router.post(
    "/resume/enrichment/apply-regenerated",
    summary="Apply regenerated items to resume data.",
)
async def apply_regenerated(
    request: ApplyRegeneratedRequest,
) -> dict:
    try:
        updated = await apply_regenerated_items(
            request.resume_data.model_dump(), request.items
        )
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error

    return {
        "message": "Changes applied successfully",
        "updated_resume": updated,
    }
