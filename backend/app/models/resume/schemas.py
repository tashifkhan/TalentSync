from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.models.common.schemas import (
    EducationEntry,
    LanguageEntry,
    ProjectEntry,
    SkillProficiency,
    UIAchievementEntry,
    UICertificationEntry,
    UIDetailedWorkExperienceEntry,
    UIPositionOfResponsibilityEntry,
    UIProjectEntry,
    UIPublicationEntry,
    WorkExperienceEntry,
)


class ComprehensiveAnalysisData(BaseModel):
    skills_analysis: List[SkillProficiency] = Field(default_factory=list)
    recommended_roles: List[str] = Field(default_factory=list)
    languages: List[LanguageEntry] = Field(default_factory=list)
    education: List[EducationEntry] = Field(default_factory=list)
    work_experience: List[UIDetailedWorkExperienceEntry] = Field(default_factory=list)
    projects: List[UIProjectEntry] = Field(default_factory=list)
    publications: List[UIPublicationEntry] = Field(default_factory=list)
    positions_of_responsibility: List[UIPositionOfResponsibilityEntry] = Field(
        default_factory=list
    )
    certifications: List[UICertificationEntry] = Field(default_factory=list)
    achievements: List[UIAchievementEntry] = Field(default_factory=list)
    name: Optional[str] = None
    email: Optional[str] = None
    contact: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    blog: Optional[str] = None
    portfolio: Optional[str] = None
    predicted_field: Optional[str] = None


class ComprehensiveAnalysisResponse(BaseModel):
    success: bool = True
    message: str = "Comprehensive analysis successful"
    data: ComprehensiveAnalysisData
    cleaned_text: Optional[str] = None


class ResumeAnalysis(BaseModel):
    name: str
    email: str
    linkedin: Optional[str] = None
    github: Optional[str] = None
    blog: Optional[str] = None
    portfolio: Optional[str] = Field(..., alias="personal_website, or any other link")
    contact: Optional[str] = None
    predicted_field: str
    college: Optional[str] = None
    work_experience: Optional[List[WorkExperienceEntry]] = Field(default_factory=list)
    projects: Optional[List[ProjectEntry]] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    upload_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ResumeUploadResponse(BaseModel):
    success: bool = True
    message: str = "Resume analyzed successfully"
    data: ResumeAnalysis
    cleaned_data_dict: Optional[dict] = None


class ResumeListResponse(BaseModel):
    success: bool = True
    message: str = "Resumes retrieved successfully"
    data: List[ResumeAnalysis]
    count: int


class ResumeCategoryResponse(BaseModel):
    success: bool = True
    message: str = "Resumes retrieved successfully"
    data: List[ResumeAnalysis]
    count: int
    category: str


class FormattedAndAnalyzedResumeResponse(BaseModel):
    success: bool = True
    message: str = "Resume formatted and analyzed successfully"
    cleaned_text: str
    analysis: ComprehensiveAnalysisData


class RecommendationItem(BaseModel):
    id: str
    title: str
    description: str
    category: str
    priority: str
    impact: str


class ResumeResult(BaseModel):
    composite: float
    semantic: float
    compatibility: float
    contact: float
    content: float
    req_keyword_cov: float = Field(..., alias="req_keyword_cov")
    opt_keyword_cov: float
    formatting: float
    keyword_density: float
    found_keywords: List[str]
    missing_keywords: List[str]
    recommended_keywords: List[str]
    recommendations: List[RecommendationItem]
    strengths: List[str]
    areas_for_improvement: List[str]
    industry_average: float
    percentile: int
    summary: str


class ScoreRequest(BaseModel):
    jd_text: Optional[str]
    resume_texts: List[str]
    career_level: Optional[str] = "mid"


class ScoreResponse(BaseModel):
    timestamp: datetime
    career_level: str
    overall_score: float
    results: List[ResumeResult]


class ResumeAnalyzerResponse(BaseModel):
    success: bool = True
    message: str
    analysis: Dict[str, Any]
    suggestions: Dict[str, Any]


class CompareToJDResponse(BaseModel):
    success: bool = True
    message: str = "Comparison complete"
    match_score: float
    summary: str
    strengths: List[str]
    gaps: List[str]
    missing_keywords: List[str]
    top_fixes: List[str]
    keyword_additions: List[str]
    improved_summary: str
