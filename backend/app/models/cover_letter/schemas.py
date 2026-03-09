from pydantic import BaseModel, Field
from typing import Optional


class CoverLetterRequest(BaseModel):
    """Request model for cover letter generation."""

    recipient_name: Optional[str] = Field(default="")
    company_name: Optional[str] = Field(default="")
    sender_name: str = Field(..., min_length=1)
    sender_role_or_goal: str = Field(default="")
    job_description: str = Field(default="")
    jd_url: Optional[str] = Field(default=None)
    key_points_to_include: str = Field(default="")
    additional_info_for_llm: Optional[str] = Field(default="")
    company_url: Optional[str] = Field(default=None)
    language: str = Field(default="en")


class CoverLetterEditRequest(CoverLetterRequest):
    """Request model for editing a generated cover letter."""

    generated_cover_letter: str = Field(default="")
    edit_instructions: str = Field(default="")


class CoverLetterResponse(BaseModel):
    """Response model for cover letter generation."""

    success: bool = True
    message: str = "Cover letter generated successfully."
    body: str
