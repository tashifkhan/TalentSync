"""Multi-pass resume refinement service."""

import copy
import json
import logging
import re
from functools import lru_cache
from typing import Any

from app.data.prompt.resume_refinement import (
    AI_PHRASE_BLACKLIST,
    AI_PHRASE_REPLACEMENTS,
    KEYWORD_INJECTION_PROMPT,
)
from app.models.refinement.schemas import (
    AlignmentReport,
    AlignmentViolation,
    KeywordGapAnalysis,
    RefinementConfig,
    RefinementResult,
)
from app.services.llm_helpers import llm_complete_json_async

logger = logging.getLogger(__name__)

MAX_JD_LENGTH = 2000


def _keyword_in_text(keyword: str, text: str) -> bool:
    escaped = re.escape(keyword.lower())
    pattern = rf"\b{escaped}\b"
    return bool(re.search(pattern, text.lower()))


async def refine_resume(
    initial_tailored: dict[str, Any],
    master_resume: dict[str, Any],
    job_description: str,
    job_keywords: dict[str, Any],
    *,
    llm,
    config: RefinementConfig | None = None,
) -> RefinementResult:
    if config is None:
        config = RefinementConfig()

    current = _deep_copy(initial_tailored)
    passes = 0
    ai_phrases_found: list[str] = []
    keyword_analysis: KeywordGapAnalysis | None = None
    alignment: AlignmentReport | None = None

    if config.enable_keyword_injection:
        keyword_analysis = analyze_keyword_gaps(job_keywords, current, master_resume)
        if keyword_analysis.injectable_keywords:
            try:
                current = await inject_keywords(
                    current,
                    keyword_analysis.injectable_keywords,
                    master_resume,
                    job_description,
                    llm=llm,
                )
                passes += 1
            except Exception as error:
                logger.warning("Keyword injection failed: %s", error)

    if config.enable_ai_phrase_removal:
        current, removed = remove_ai_phrases(current)
        ai_phrases_found.extend(removed)
        if removed:
            passes += 1

    if config.enable_master_alignment_check:
        alignment = validate_master_alignment(current, master_resume)
        if not alignment.is_aligned:
            current = fix_alignment_violations(current, alignment.violations)
            passes += 1

    final_match = calculate_keyword_match(current, job_keywords)

    return RefinementResult(
        refined_data=current,
        passes_completed=passes,
        keyword_analysis=keyword_analysis,
        alignment_report=alignment,
        ai_phrases_removed=ai_phrases_found,
        final_match_percentage=final_match,
    )


def analyze_keyword_gaps(
    jd_keywords: dict[str, Any],
    tailored: dict[str, Any],
    master: dict[str, Any],
) -> KeywordGapAnalysis:
    tailored_text = _extract_all_text(tailored).lower()
    master_text = _extract_all_text(master).lower()

    all_jd_keywords: set[str] = set()
    all_jd_keywords.update(jd_keywords.get("required_skills", []))
    all_jd_keywords.update(jd_keywords.get("preferred_skills", []))
    all_jd_keywords.update(jd_keywords.get("keywords", []))

    missing: list[str] = []
    injectable: list[str] = []
    non_injectable: list[str] = []

    for keyword in all_jd_keywords:
        if not _keyword_in_text(keyword, tailored_text):
            missing.append(keyword)
            if _keyword_in_text(keyword, master_text):
                injectable.append(keyword)
            else:
                non_injectable.append(keyword)

    total = len(all_jd_keywords) if all_jd_keywords else 1
    current_match = (total - len(missing)) / total * 100
    potential_match = (total - len(non_injectable)) / total * 100

    return KeywordGapAnalysis(
        missing_keywords=missing,
        injectable_keywords=injectable,
        non_injectable_keywords=non_injectable,
        current_match_percentage=current_match,
        potential_match_percentage=potential_match,
    )


def remove_ai_phrases(data: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    removed: set[str] = set()

    def clean_text(text: str) -> str:
        cleaned = text
        for phrase in AI_PHRASE_BLACKLIST:
            if phrase.lower() in cleaned.lower():
                removed.add(phrase)
                replacement = AI_PHRASE_REPLACEMENTS.get(phrase.lower(), "")
                pattern = re.compile(re.escape(phrase), re.IGNORECASE)
                cleaned = pattern.sub(replacement, cleaned)
        return cleaned

    def clean_recursive(obj: Any) -> Any:
        if isinstance(obj, str):
            return clean_text(obj)
        if isinstance(obj, list):
            return [clean_recursive(item) for item in obj]
        if isinstance(obj, dict):
            return {k: clean_recursive(v) for k, v in obj.items()}
        return obj

    cleaned_data = clean_recursive(data)
    return cleaned_data, list(removed)


def validate_master_alignment(
    tailored: dict[str, Any],
    master: dict[str, Any],
) -> AlignmentReport:
    violations: list[AlignmentViolation] = []

    tailored_skills = set(
        s.get("skill_name", "").lower()
        for s in tailored.get("skills_analysis", [])
        if isinstance(s, dict) and isinstance(s.get("skill_name"), str)
    )
    master_skills = set(
        s.get("skill_name", "").lower()
        for s in master.get("skills_analysis", [])
        if isinstance(s, dict) and isinstance(s.get("skill_name"), str)
    )

    for skill in tailored_skills - master_skills:
        violations.append(
            AlignmentViolation(
                field_path="skills_analysis",
                violation_type="fabricated_skill",
                value=skill,
                severity="critical",
            )
        )

    tailored_certs = set(
        c.get("name", "").lower()
        for c in tailored.get("certifications", [])
        if isinstance(c, dict) and isinstance(c.get("name"), str)
    )
    master_certs = set(
        c.get("name", "").lower()
        for c in master.get("certifications", [])
        if isinstance(c, dict) and isinstance(c.get("name"), str)
    )

    for cert in tailored_certs - master_certs:
        violations.append(
            AlignmentViolation(
                field_path="certifications",
                violation_type="fabricated_cert",
                value=cert,
                severity="critical",
            )
        )

    tailored_companies = set(
        exp.get("company_and_duration", "").lower()
        for exp in tailored.get("work_experience", [])
        if isinstance(exp, dict)
    )
    master_companies = set(
        exp.get("company_and_duration", "").lower()
        for exp in master.get("work_experience", [])
        if isinstance(exp, dict)
    )

    for company in tailored_companies - master_companies:
        if company:
            violations.append(
                AlignmentViolation(
                    field_path="work_experience",
                    violation_type="fabricated_company",
                    value=company,
                    severity="critical",
                )
            )

    is_aligned = len([v for v in violations if v.severity == "critical"]) == 0
    confidence = 1.0 - (len(violations) * 0.1)

    return AlignmentReport(
        is_aligned=is_aligned,
        violations=violations,
        confidence_score=max(0.0, confidence),
    )


def _prepare_job_description(job_description: str) -> tuple[str, bool]:
    was_truncated = len(job_description) > MAX_JD_LENGTH
    return job_description[:MAX_JD_LENGTH], was_truncated


def _validate_resume_structure(data: dict[str, Any]) -> bool:
    required_keys = ["skills_analysis", "work_experience", "projects", "education"]
    for key in required_keys:
        if key not in data:
            return False

    array_fields = ["work_experience", "education", "projects"]
    for field in array_fields:
        if field in data and not isinstance(data[field], list):
            return False

    return True


async def inject_keywords(
    tailored: dict[str, Any],
    keywords_to_inject: list[str],
    master: dict[str, Any],
    job_description: str,
    *,
    llm,
) -> dict[str, Any]:
    truncated_jd, _ = _prepare_job_description(job_description)

    prompt = KEYWORD_INJECTION_PROMPT.format(
        keywords_to_inject=json.dumps(keywords_to_inject, ensure_ascii=True),
        current_resume=json.dumps(tailored, indent=2, ensure_ascii=True),
        master_resume=json.dumps(master, indent=2, ensure_ascii=True),
        job_description=truncated_jd,
    )

    try:
        result = await llm_complete_json_async(
            llm,
            prompt,
            system_prompt=(
                "You are a resume editor. Inject keywords naturally without adding "
                "fabricated content. Return only valid JSON matching the input schema."
            ),
            max_tokens=8192,
        )

        if not isinstance(result, dict):
            return tailored
        if not _validate_resume_structure(result):
            return tailored
        return result
    except Exception as error:
        logger.warning("Keyword injection failed: %s", error)
        return tailored


def fix_alignment_violations(
    tailored: dict[str, Any],
    violations: list[AlignmentViolation],
) -> dict[str, Any]:
    fixed = _deep_copy(tailored)

    for violation in violations:
        if violation.severity != "critical":
            continue

        if violation.violation_type == "fabricated_skill":
            skills = fixed.get("skills_analysis", [])
            fixed["skills_analysis"] = [
                s
                for s in skills
                if not (
                    isinstance(s, dict)
                    and isinstance(s.get("skill_name"), str)
                    and s.get("skill_name", "").lower() == violation.value.lower()
                )
            ]
        elif violation.violation_type == "fabricated_cert":
            certs = fixed.get("certifications", [])
            fixed["certifications"] = [
                c
                for c in certs
                if not (
                    isinstance(c, dict)
                    and isinstance(c.get("name"), str)
                    and c.get("name", "").lower() == violation.value.lower()
                )
            ]
        elif violation.violation_type == "fabricated_company":
            if "work_experience" in fixed:
                fixed["work_experience"] = [
                    exp
                    for exp in fixed["work_experience"]
                    if exp.get("company_and_duration", "").lower()
                    != violation.value.lower()
                ]

    return fixed


def calculate_keyword_match(
    resume: dict[str, Any],
    jd_keywords: dict[str, Any],
) -> float:
    resume_text = _extract_all_text(resume).lower()

    all_keywords: set[str] = set()
    all_keywords.update(jd_keywords.get("required_skills", []))
    all_keywords.update(jd_keywords.get("preferred_skills", []))
    all_keywords.update(jd_keywords.get("keywords", []))

    if not all_keywords:
        return 0.0

    matched = sum(1 for kw in all_keywords if _keyword_in_text(kw, resume_text))
    return (matched / len(all_keywords)) * 100


def _extract_all_text(data: dict[str, Any]) -> str:
    data_json = json.dumps(data, sort_keys=True, default=str)
    return _extract_all_text_cached(data_json)


@lru_cache(maxsize=100)
def _extract_all_text_cached(data_json: str) -> str:
    data = json.loads(data_json)
    parts: list[str] = []

    if data.get("summary"):
        parts.append(str(data["summary"]))

    for exp in data.get("work_experience", []):
        if isinstance(exp, dict):
            parts.append(str(exp.get("role", "")))
            parts.append(str(exp.get("company_and_duration", "")))
            desc = exp.get("bullet_points", [])
            if isinstance(desc, list):
                parts.extend(str(d) for d in desc)

    for edu in data.get("education", []):
        if isinstance(edu, dict):
            parts.append(str(edu.get("education_detail", "")))

    for proj in data.get("projects", []):
        if isinstance(proj, dict):
            parts.append(str(proj.get("title", "")))
            tech = proj.get("technologies_used", [])
            if isinstance(tech, list):
                parts.extend(str(t) for t in tech)
            desc = proj.get("description", [])
            if isinstance(desc, list):
                parts.extend(str(d) for d in desc)

    skills = data.get("skills_analysis", [])
    if isinstance(skills, list):
        for skill in skills:
            if isinstance(skill, dict) and isinstance(skill.get("skill_name"), str):
                parts.append(skill.get("skill_name", ""))

    certs = data.get("certifications", [])
    if isinstance(certs, list):
        for cert in certs:
            if isinstance(cert, dict) and isinstance(cert.get("name"), str):
                parts.append(cert.get("name", ""))

    return " ".join(p for p in parts if p)


def _deep_copy(data: dict[str, Any]) -> dict[str, Any]:
    return copy.deepcopy(data)
