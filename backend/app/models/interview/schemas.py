"""Pydantic schemas for the interview module."""

from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, Field

from app.models.interview.enums import (
    DifficultyLevel,
    InterviewStatus,
    QuestionSource,
    InterviewEventType,
)


def generate_uuid() -> str:
    """Generate a UUID string."""
    return str(uuid.uuid4())


class InterviewQuestion(BaseModel):
    """A single interview question with optional answer and evaluation."""

    id: str = Field(default_factory=generate_uuid)
    index: int
    question: str
    difficulty: DifficultyLevel
    source: QuestionSource
    topic: Optional[str] = None
    expected_keywords: List[str] = Field(default_factory=list)
    follow_up_questions: List[str] = Field(default_factory=list)
    code_challenge: Optional[str] = None
    # Answer and evaluation
    answer: Optional[str] = None
    code_submission: Optional[str] = None
    code_language: Optional[str] = None
    score: Optional[int] = None  # 1-5
    feedback: Optional[str] = None
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    answered_at: Optional[datetime] = None


class CandidateProfile(BaseModel):
    """Profile information for the interview candidate."""

    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    resume_text: Optional[str] = None
    resume_data: Optional[Dict[str, Any]] = None


class InterviewConfig(BaseModel):
    """Configuration for an interview session."""

    role: str
    template_id: Optional[str] = None
    topic: Optional[str] = None
    num_questions: int = Field(default=5, ge=1, le=20)
    difficulty_distribution: Dict[str, int] = Field(
        default_factory=lambda: {"easy": 1, "medium": 3, "hard": 1}
    )
    time_limit_minutes: Optional[int] = None
    includes_coding: bool = False
    coding_languages: List[str] = Field(default_factory=list)
    voice_enabled: bool = False
    voice_language: str = "en-US"


class InterviewSession(BaseModel):
    """Complete interview session with questions and results."""

    session_id: str = Field(default_factory=generate_uuid)
    status: InterviewStatus = InterviewStatus.PENDING
    profile: CandidateProfile
    config: InterviewConfig
    questions: List[InterviewQuestion] = Field(default_factory=list)
    current_question_index: int = 0
    # Results
    final_score: Optional[int] = None
    summary: Optional[str] = None
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    hiring_recommendation: Optional[str] = None
    # Tracking
    tab_switch_count: int = 0
    events: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class InterviewEvent(BaseModel):
    """An event that occurred during an interview."""

    id: str = Field(default_factory=generate_uuid)
    session_id: str
    event_type: InterviewEventType
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


# Request Models


class CreateInterviewRequest(BaseModel):
    """Request to create a new interview session."""

    profile: CandidateProfile
    config: InterviewConfig


class SubmitAnswerRequest(BaseModel):
    """Request to submit an answer to a question."""

    question_id: str
    answer: str
    code_submission: Optional[str] = None
    code_language: Optional[str] = None


class CodeExecutionRequest(BaseModel):
    """Request to execute code for a coding question."""

    question_id: str
    code: str
    language: str
    test_input: Optional[str] = None


class InterviewEventRequest(BaseModel):
    """Request to record an interview event."""

    event_type: InterviewEventType
    metadata: Dict[str, Any] = Field(default_factory=dict)


# Response Models


class InterviewSessionResponse(BaseModel):
    """Response containing an interview session."""

    session: InterviewSession
    current_question: Optional[InterviewQuestion] = None


class EvaluationResult(BaseModel):
    """Result of answer evaluation."""

    score: int  # 1-5
    feedback: str
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)


class CodeExecutionResult(BaseModel):
    """Result of code execution."""

    success: bool
    stdout: str
    stderr: str
    execution_time_ms: int
    memory_usage_mb: Optional[float] = None
    test_results: Optional[List[Dict[str, Any]]] = None
