"""Resume improvement and refinement endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException
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
logger = logging.getLogger(__name__)


@router.post(
    "/resume/improve",
    response_model=ResumeImproveResponse,
    summary="Improve a resume with keyword alignment and refinement.",
)
async def improve_resume_endpoint(
    payload: ResumeImproveRequest,
    llm: BaseChatModel = Depends(get_request_llm),
) -> ResumeImproveResponse:
    try:
        return await improve_resume_with_refinement(payload, llm=llm)
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("Resume improve endpoint failed")
        raise HTTPException(
            status_code=500,
            detail=f"Resume improvement failed: {error}",
        ) from error


@router.post(
    "/resume/refine",
    response_model=ResumeRefineResponse,
    summary="Refine an existing tailored resume.",
)
async def refine_resume_endpoint(
    payload: ResumeRefineRequest,
    llm: BaseChatModel = Depends(get_request_llm),
) -> ResumeRefineResponse:
    try:
        return await refine_existing_resume(payload, llm=llm)
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("Resume refine endpoint failed")
        raise HTTPException(
            status_code=500,
            detail=f"Resume refinement failed: {error}",
        ) from error
