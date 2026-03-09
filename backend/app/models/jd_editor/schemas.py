"""Schemas for JD-targeted resume editing."""

from pydantic import BaseModel, Field

from app.models.improvement.schemas import ResumeDiffSummary, ResumeFieldDiff
from app.models.resume.schemas import ComprehensiveAnalysisData


class JDEditRequest(BaseModel):
    """Request to edit a resume against a specific job description."""

    resume_text: str
    resume_data: ComprehensiveAnalysisData
    job_description: str
    jd_url: str | None = None
    company_name: str | None = None
    language: str = "en"


class JDEditChange(BaseModel):
    """A single targeted change made to align the resume with the JD."""

    field: str
    field_type: str
    original: str
    edited: str
    reason: str


class JDEditResponse(BaseModel):
    """Response for JD-targeted resume editing."""

    success: bool = True
    message: str = "Resume edited for job description successfully"
    edited_resume: ComprehensiveAnalysisData
    changes: list[JDEditChange] = Field(default_factory=list)
    diff_summary: ResumeDiffSummary | None = None
    detailed_changes: list[ResumeFieldDiff] | None = None
    ats_score_before: int | None = None
    ats_score_after: int | None = None
    keywords_addressed: list[str] = Field(default_factory=list)
    keywords_missing: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
