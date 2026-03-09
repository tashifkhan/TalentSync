"""Schemas for resume improvement and diffing."""

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

from app.models.refinement.schemas import RefinementConfig, RefinementStats
from app.models.resume.schemas import ComprehensiveAnalysisData


class ImprovementSuggestion(BaseModel):
    """Single improvement suggestion."""

    suggestion: str
    lineNumber: int | None = None


class ResumeFieldDiff(BaseModel):
    """Single field change record."""

    field_path: str
    field_type: Literal[
        "skill",
        "description",
        "summary",
        "certification",
        "experience",
        "education",
        "project",
    ]
    change_type: Literal["added", "removed", "modified"]
    original_value: str | None = None
    new_value: str | None = None
    confidence: Literal["low", "medium", "high"] = "medium"


class ResumeDiffSummary(BaseModel):
    """Change summary stats."""

    total_changes: int
    skills_added: int
    skills_removed: int
    descriptions_modified: int
    certifications_added: int
    high_risk_changes: int


class ResumeImproveRequest(BaseModel):
    """Request to improve a resume."""

    resume_text: str
    resume_data: ComprehensiveAnalysisData
    job_description: str
    job_keywords: Optional[dict[str, Any]] = None
    prompt_id: Optional[str] = None
    language: str = "en"
    refinement_config: RefinementConfig | None = None


class ResumeImproveResponse(BaseModel):
    """Response for resume improvement."""

    success: bool = True
    message: str = "Resume improved successfully"
    improved_resume: ComprehensiveAnalysisData
    improvements: list[ImprovementSuggestion] = Field(default_factory=list)
    diff_summary: ResumeDiffSummary | None = None
    detailed_changes: list[ResumeFieldDiff] | None = None
    refinement_stats: RefinementStats | None = None
    warnings: list[str] = Field(default_factory=list)
    refinement_attempted: bool = False
    refinement_successful: bool = False


class ResumeRefineRequest(BaseModel):
    """Request to refine an existing tailored resume."""

    tailored_resume: dict[str, Any]
    resume_data: ComprehensiveAnalysisData
    job_description: str
    job_keywords: Optional[dict[str, Any]] = None
    refinement_config: RefinementConfig | None = None


class ResumeRefineResponse(BaseModel):
    """Response for resume refinement."""

    success: bool = True
    message: str = "Resume refined successfully"
    refined_resume: ComprehensiveAnalysisData
    refinement_stats: RefinementStats | None = None
