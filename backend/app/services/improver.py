"""Resume improvement service using LLM."""

import json
import logging
import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Any, Callable, Literal

from app.data.prompt.resume_improvement import (
    CRITICAL_TRUTHFULNESS_RULES,
    DEFAULT_IMPROVE_PROMPT_ID,
    EXTRACT_KEYWORDS_PROMPT,
    IMPROVE_RESUME_PROMPTS,
    RESUME_SCHEMA,
)
from app.models.resume.schemas import ComprehensiveAnalysisData
from app.models.improvement.schemas import ResumeFieldDiff, ResumeDiffSummary
from app.services.language import get_language_name
from app.services.llm_helpers import llm_complete_json_async

logger = logging.getLogger(__name__)

_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"disregard\s+(all\s+)?above",
    r"forget\s+(everything|all)",
    r"new\s+instructions?:",
    r"system\s*:",
    r"<\s*/?\s*system\s*>",
    r"\[\s*INST\s*\]",
    r"\[\s*/\s*INST\s*\]",
]


FieldType = Literal[
    "skill",
    "description",
    "certification",
    "experience",
    "education",
    "project",
]
ConfidenceLevel = Literal["low", "medium", "high"]


@dataclass(frozen=True)
class DiffConfidence:
    added: ConfidenceLevel
    removed: ConfidenceLevel
    modified: ConfidenceLevel


def _sanitize_user_input(text: str) -> str:
    sanitized = text
    for pattern in _INJECTION_PATTERNS:
        sanitized = re.sub(pattern, "[REDACTED]", sanitized, flags=re.IGNORECASE)
    return sanitized


def _check_for_truncation(data: dict[str, Any]) -> None:
    required_sections = ["skills_analysis", "work_experience", "projects", "education"]
    for section in required_sections:
        if section not in data:
            raise ValueError(f"Missing required section: {section}")

    if "work_experience" in data and data["work_experience"] == []:
        logger.warning("Resume has empty work_experience - possible truncation")


async def extract_job_keywords(job_description: str, *, llm) -> dict[str, Any]:
    sanitized_jd = _sanitize_user_input(job_description)
    prompt = EXTRACT_KEYWORDS_PROMPT.format(job_description=sanitized_jd)

    return await llm_complete_json_async(
        llm,
        prompt,
        system_prompt="You are an expert job description analyzer.",
    )


async def improve_resume(
    original_resume: str,
    job_description: str,
    job_keywords: dict[str, Any],
    *,
    llm,
    language: str = "en",
    prompt_id: str | None = None,
) -> dict[str, Any]:
    keywords_str = json.dumps(job_keywords, indent=2, ensure_ascii=True)
    output_language = get_language_name(language)

    selected_prompt_id = prompt_id or DEFAULT_IMPROVE_PROMPT_ID
    prompt_template = IMPROVE_RESUME_PROMPTS.get(
        selected_prompt_id, IMPROVE_RESUME_PROMPTS[DEFAULT_IMPROVE_PROMPT_ID]
    )
    if selected_prompt_id not in CRITICAL_TRUTHFULNESS_RULES:
        logger.warning(
            "Missing truthfulness rules for prompt '%s'; using default rules.",
            selected_prompt_id,
        )
    truthfulness_rules = CRITICAL_TRUTHFULNESS_RULES.get(
        selected_prompt_id, CRITICAL_TRUTHFULNESS_RULES[DEFAULT_IMPROVE_PROMPT_ID]
    )

    sanitized_jd = _sanitize_user_input(job_description)

    prompt = prompt_template.format(
        job_description=sanitized_jd,
        job_keywords=keywords_str,
        original_resume=original_resume,
        schema=RESUME_SCHEMA,
        output_language=output_language,
        critical_truthfulness_rules=truthfulness_rules,
    )

    result = await llm_complete_json_async(
        llm,
        prompt,
        system_prompt="You are an expert resume editor. Output only valid JSON.",
        max_tokens=8192,
    )

    _check_for_truncation(result)

    validated = ComprehensiveAnalysisData.model_validate(result)
    return validated.model_dump()


def _format_entry_label(parts: list[str], fallback: str) -> str:
    label = " | ".join([part for part in parts if part])
    return label if label else fallback


def _format_experience_entry(entry: dict[str, Any], index: int) -> str:
    return _format_entry_label(
        [
            entry.get("role", ""),
            entry.get("company_and_duration", ""),
        ],
        f"Work experience #{index + 1}",
    )


def _format_education_entry(entry: dict[str, Any], index: int) -> str:
    return _format_entry_label(
        [
            entry.get("education_detail", ""),
        ],
        f"Education #{index + 1}",
    )


def _format_project_entry(entry: dict[str, Any], index: int) -> str:
    technologies = entry.get("technologies_used", [])
    technologies_text = (
        ", ".join(technologies) if isinstance(technologies, list) else ""
    )
    return _format_entry_label(
        [
            entry.get("title", ""),
            technologies_text,
        ],
        f"Project #{index + 1}",
    )


def _normalize_entry(
    entry: dict[str, Any],
    ignore_keys: set[str] | None,
) -> dict[str, Any]:
    if ignore_keys is None:
        return entry
    return {key: value for key, value in entry.items() if key not in ignore_keys}


def _append_entry_changes(
    changes: list[ResumeFieldDiff],
    field_key: str,
    field_type: FieldType,
    original_items: list[dict[str, Any]],
    improved_items: list[dict[str, Any]],
    formatter: Callable[[dict[str, Any], int], str],
    ignore_keys: set[str] | None = None,
) -> None:
    min_len = min(len(original_items), len(improved_items))

    for idx in range(min_len):
        original_entry = original_items[idx]
        improved_entry = improved_items[idx]
        if _normalize_entry(original_entry, ignore_keys) != _normalize_entry(
            improved_entry, ignore_keys
        ):
            changes.append(
                ResumeFieldDiff(
                    field_path=f"{field_key}[{idx}]",
                    field_type=field_type,
                    change_type="modified",
                    original_value=formatter(original_entry, idx),
                    new_value=formatter(improved_entry, idx),
                    confidence="medium",
                )
            )

    for idx in range(min_len, len(improved_items)):
        changes.append(
            ResumeFieldDiff(
                field_path=f"{field_key}[{idx}]",
                field_type=field_type,
                change_type="added",
                new_value=formatter(improved_items[idx], idx),
                confidence="high",
            )
        )

    for idx in range(min_len, len(original_items)):
        changes.append(
            ResumeFieldDiff(
                field_path=f"{field_key}[{idx}]",
                field_type=field_type,
                change_type="removed",
                original_value=formatter(original_items[idx], idx),
                confidence="medium",
            )
        )


def _normalize_string_list(value: Any, field_name: str) -> list[str]:
    if not isinstance(value, list):
        return []
    normalized: list[str] = []
    invalid_count = 0
    for item in value:
        if isinstance(item, str):
            stripped = item.strip()
            if stripped:
                normalized.append(stripped)
            continue
        if isinstance(item, dict):
            candidate = (
                item.get("skill_name")
                or item.get("name")
                or item.get("label")
                or item.get("value")
            )
            if isinstance(candidate, str):
                stripped = candidate.strip()
                if stripped:
                    normalized.append(stripped)
                else:
                    invalid_count += 1
            else:
                invalid_count += 1
            continue
        if item is None:
            continue
        invalid_count += 1
    if invalid_count:
        logger.warning(
            "Skipped non-string entries in %s: %d", field_name, invalid_count
        )
    return normalized


def _build_string_index(value: Any, field_name: str) -> dict[str, str]:
    items = _normalize_string_list(value, field_name)
    index: dict[str, str] = {}
    for item in items:
        key = item.casefold()
        if key not in index:
            index[key] = item
    return index


def _extract_description_list(entry: Any) -> list[str]:
    if not isinstance(entry, dict):
        return []
    return _normalize_string_list(
        entry.get("bullet_points", []), "work_experience.bullet_points"
    )


def _extract_project_description_list(entry: Any) -> list[str]:
    if not isinstance(entry, dict):
        return []
    return _normalize_string_list(entry.get("description", []), "projects.description")


def _append_list_changes(
    changes: list[ResumeFieldDiff],
    field_path: str,
    field_type: FieldType,
    original_items: list[str],
    improved_items: list[str],
    confidences: DiffConfidence,
) -> None:
    matcher = SequenceMatcher(a=original_items, b=improved_items, autojunk=False)
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            continue
        if tag == "delete":
            for item in original_items[i1:i2]:
                changes.append(
                    ResumeFieldDiff(
                        field_path=field_path,
                        field_type=field_type,
                        change_type="removed",
                        original_value=item,
                        confidence=confidences.removed,
                    )
                )
        elif tag == "insert":
            for item in improved_items[j1:j2]:
                changes.append(
                    ResumeFieldDiff(
                        field_path=field_path,
                        field_type=field_type,
                        change_type="added",
                        new_value=item,
                        confidence=confidences.added,
                    )
                )
        elif tag == "replace":
            original_segment = original_items[i1:i2]
            improved_segment = improved_items[j1:j2]
            segment_len = max(len(original_segment), len(improved_segment))
            for offset in range(segment_len):
                original_value = (
                    original_segment[offset] if offset < len(original_segment) else None
                )
                new_value = (
                    improved_segment[offset] if offset < len(improved_segment) else None
                )
                if original_value is not None and new_value is not None:
                    changes.append(
                        ResumeFieldDiff(
                            field_path=field_path,
                            field_type=field_type,
                            change_type="modified",
                            original_value=original_value,
                            new_value=new_value,
                            confidence=confidences.modified,
                        )
                    )
                elif new_value is not None:
                    changes.append(
                        ResumeFieldDiff(
                            field_path=field_path,
                            field_type=field_type,
                            change_type="added",
                            new_value=new_value,
                            confidence=confidences.added,
                        )
                    )
                elif original_value is not None:
                    changes.append(
                        ResumeFieldDiff(
                            field_path=field_path,
                            field_type=field_type,
                            change_type="removed",
                            original_value=original_value,
                            confidence=confidences.removed,
                        )
                    )


def calculate_resume_diff(
    original: dict[str, Any],
    improved: dict[str, Any],
) -> tuple[ResumeDiffSummary, list[ResumeFieldDiff]]:
    changes: list[ResumeFieldDiff] = []

    orig_skills = _build_string_index(
        original.get("skills_analysis", []),
        "skills_analysis",
    )
    new_skills = _build_string_index(
        improved.get("skills_analysis", []),
        "skills_analysis",
    )
    orig_skill_keys = set(orig_skills)
    new_skill_keys = set(new_skills)
    for skill_key in new_skill_keys - orig_skill_keys:
        changes.append(
            ResumeFieldDiff(
                field_path="skills_analysis",
                field_type="skill",
                change_type="added",
                new_value=new_skills[skill_key],
                confidence="high",
            )
        )

    for skill_key in orig_skill_keys - new_skill_keys:
        changes.append(
            ResumeFieldDiff(
                field_path="skills_analysis",
                field_type="skill",
                change_type="removed",
                original_value=orig_skills[skill_key],
                confidence="medium",
            )
        )

    original_experiences = original.get("work_experience", [])
    improved_experiences = improved.get("work_experience", [])
    max_experience_len = max(len(original_experiences), len(improved_experiences))
    confidences = DiffConfidence(added="medium", removed="low", modified="medium")
    for idx in range(max_experience_len):
        original_entry = (
            original_experiences[idx] if idx < len(original_experiences) else None
        )
        improved_entry = (
            improved_experiences[idx] if idx < len(improved_experiences) else None
        )
        if not original_entry and not improved_entry:
            continue
        _append_list_changes(
            changes,
            field_path=f"work_experience[{idx}].bullet_points",
            field_type="description",
            original_items=_extract_description_list(original_entry),
            improved_items=_extract_description_list(improved_entry),
            confidences=confidences,
        )

    orig_certs = _build_string_index(
        original.get("certifications", []),
        "certifications",
    )
    new_certs = _build_string_index(
        improved.get("certifications", []),
        "certifications",
    )
    orig_cert_keys = set(orig_certs)
    new_cert_keys = set(new_certs)
    for cert_key in new_cert_keys - orig_cert_keys:
        changes.append(
            ResumeFieldDiff(
                field_path="certifications",
                field_type="certification",
                change_type="added",
                new_value=new_certs[cert_key],
                confidence="high",
            )
        )

    for cert_key in orig_cert_keys - new_cert_keys:
        changes.append(
            ResumeFieldDiff(
                field_path="certifications",
                field_type="certification",
                change_type="removed",
                original_value=orig_certs[cert_key],
                confidence="medium",
            )
        )

    _append_entry_changes(
        changes,
        "work_experience",
        "experience",
        original.get("work_experience", []),
        improved.get("work_experience", []),
        _format_experience_entry,
        {"bullet_points"},
    )
    _append_entry_changes(
        changes,
        "education",
        "education",
        original.get("education", []),
        improved.get("education", []),
        _format_education_entry,
    )
    _append_entry_changes(
        changes,
        "projects",
        "project",
        original.get("projects", []),
        improved.get("projects", []),
        _format_project_entry,
        {"description"},
    )

    summary = ResumeDiffSummary(
        total_changes=len(changes),
        skills_added=len(
            [c for c in changes if c.field_type == "skill" and c.change_type == "added"]
        ),
        skills_removed=len(
            [
                c
                for c in changes
                if c.field_type == "skill" and c.change_type == "removed"
            ]
        ),
        descriptions_modified=len(
            [
                c
                for c in changes
                if c.field_type == "description" and c.change_type == "modified"
            ]
        ),
        certifications_added=len(
            [
                c
                for c in changes
                if c.field_type == "certification" and c.change_type == "added"
            ]
        ),
        high_risk_changes=len([c for c in changes if c.confidence == "high"]),
    )

    return summary, changes


def generate_improvements(job_keywords: dict[str, Any]) -> list[dict[str, Any]]:
    improvements = []

    required_skills = job_keywords.get("required_skills", [])
    for skill in required_skills[:3]:
        improvements.append(
            {
                "suggestion": f"Emphasized '{skill}' to match job requirements",
                "lineNumber": None,
            }
        )

    responsibilities = job_keywords.get("key_responsibilities", [])
    for resp in responsibilities[:2]:
        improvements.append(
            {
                "suggestion": f"Aligned experience with: {resp}",
                "lineNumber": None,
            }
        )

    if not improvements:
        improvements.append(
            {
                "suggestion": "Resume content optimized for better keyword alignment with job description",
                "lineNumber": None,
            }
        )

    return improvements
