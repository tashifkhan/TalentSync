"""JD-targeted resume editing endpoint."""

from fastapi import APIRouter, Depends
from langchain_core.language_models import BaseChatModel

from app.core.deps import get_request_llm
from app.models.jd_editor.schemas import JDEditRequest, JDEditResponse
from app.services.jd_editor import edit_resume_for_jd

router = APIRouter()


@router.post(
    "/resume/edit-by-jd",
    response_model=JDEditResponse,
    summary="Edit a resume to align with a specific job description.",
)
async def edit_resume_by_jd_endpoint(
    payload: JDEditRequest,
    llm: BaseChatModel = Depends(get_request_llm),
) -> JDEditResponse:
    return await edit_resume_for_jd(payload, llm=llm)
