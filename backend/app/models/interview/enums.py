"""Enums for the interview module."""

from enum import Enum


class DifficultyLevel(str, Enum):
    """Difficulty level for interview questions."""

    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class InterviewStatus(str, Enum):
    """Status of an interview session."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class QuestionSource(str, Enum):
    """Source/category of interview questions."""

    RESUME_BASED = "resume_based"
    ROLE_BASED = "role_based"
    BEHAVIORAL = "behavioral"
    TECHNICAL = "technical"
    CODING = "coding"


class InterviewEventType(str, Enum):
    """Types of events that can occur during an interview."""

    TAB_SWITCH = "tab_switch"
    FOCUS_LOST = "focus_lost"
    FOCUS_GAINED = "focus_gained"
    CODE_EXECUTED = "code_executed"
    QUESTION_SKIPPED = "question_skipped"
    SESSION_PAUSED = "session_paused"
    SESSION_RESUMED = "session_resumed"
