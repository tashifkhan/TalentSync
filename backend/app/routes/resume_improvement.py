"""Resume improvement and refinement endpoints."""

from fastapi import APIRouter, Depends
from langchain_core.language_models import BaseChatModel

from app.core.deps import get_request_llm
from app.models.improvement.schemas import (
    ResumeImproveRequest,
    ResumeImproveResponse,
    ResumeRefineRequest,
    ResumeRefineResponse,
)
from app.services.resume_improvement import (
    improve_resume_with_refinement,
    refine_existing_resume,
)

router = APIRouter()


@router.post(
    "/resume/improve",
    response_model=ResumeImproveResponse,
    summary="Improve a resume with keyword alignment and refinement.",
)
async def improve_resume_endpoint(
    payload: ResumeImproveRequest,
    llm: BaseChatModel = Depends(get_request_llm),
) -> ResumeImproveResponse:
    return await improve_resume_with_refinement(payload, llm=llm)


@router.post(
    "/resume/refine",
    response_model=ResumeRefineResponse,
    summary="Refine an existing tailored resume.",
)
async def refine_resume_endpoint(
    payload: ResumeRefineRequest,
    llm: BaseChatModel = Depends(get_request_llm),
) -> ResumeRefineResponse:
    return await refine_existing_resume(payload, llm=llm)
