"""Cover letter generation and editing routes."""

from typing import Optional

from fastapi import APIRouter, Depends, Form
from langchain_core.language_models import BaseChatModel

from app.core.deps import get_request_llm
from app.models.cover_letter.schemas import CoverLetterResponse
from app.services.cover_letter import generate_cover_letter, edit_cover_letter


router = APIRouter()


@router.post(
    "/cover-letter/generator/",
    response_model=CoverLetterResponse,
    description="Generates a cover letter based on the provided resume text and user inputs.",
)
async def cover_letter_generate(
    resume_text: str = Form(...),
    recipient_name: str = Form(""),
    company_name: str = Form(""),
    sender_name: str = Form(...),
    sender_role_or_goal: str = Form(""),
    job_description: str = Form(""),
    jd_url: Optional[str] = Form(None),
    key_points_to_include: Optional[str] = Form(""),
    additional_info_for_llm: Optional[str] = Form(""),
    company_url: Optional[str] = Form(None),
    language: str = Form("en"),
    llm: BaseChatModel = Depends(get_request_llm),
):
    # Build a simple resume data dict from the raw text
    resume_data = {"raw_text": resume_text}

    body = await generate_cover_letter(
        resume_data=resume_data,
        job_description=job_description,
        jd_url=jd_url,
        llm=llm,
        recipient_name=recipient_name,
        company_name=company_name,
        sender_name=sender_name,
        sender_role_or_goal=sender_role_or_goal,
        key_points_to_include=key_points_to_include or "",
        additional_info=additional_info_for_llm or "",
        language=language,
    )

    return CoverLetterResponse(
        success=True,
        message="Cover letter generated successfully.",
        body=body,
    )


@router.post(
    "/cover-letter/edit/",
    response_model=CoverLetterResponse,
    description="Edit a cover letter based on the provided resume text and user instructions.",
)
async def cover_letter_edit(
    resume_text: str = Form(...),
    recipient_name: str = Form(""),
    company_name: str = Form(""),
    sender_name: str = Form(...),
    sender_role_or_goal: str = Form(""),
    job_description: str = Form(""),
    jd_url: Optional[str] = Form(None),
    key_points_to_include: Optional[str] = Form(""),
    additional_info_for_llm: Optional[str] = Form(""),
    company_url: Optional[str] = Form(None),
    generated_cover_letter: str = Form(...),
    edit_instructions: str = Form(""),
    language: str = Form("en"),
    llm: BaseChatModel = Depends(get_request_llm),
):
    resume_data = {"raw_text": resume_text}

    body = await edit_cover_letter(
        resume_data=resume_data,
        job_description=job_description,
        jd_url=jd_url,
        previous_cover_letter=generated_cover_letter,
        edit_instructions=edit_instructions,
        llm=llm,
        recipient_name=recipient_name,
        company_name=company_name,
        sender_name=sender_name,
        sender_role_or_goal=sender_role_or_goal,
        key_points_to_include=key_points_to_include or "",
        additional_info=additional_info_for_llm or "",
        language=language,
    )

    return CoverLetterResponse(
        success=True,
        message="Cover letter edited successfully.",
        body=body,
    )
