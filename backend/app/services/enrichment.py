"""AI-powered resume enrichment endpoints service helpers."""

import copy
import json
import logging
import re

from app.data.prompt.enrichment import (
    ANALYZE_RESUME_PROMPT,
    ENHANCE_DESCRIPTION_PROMPT,
    REFINE_ENHANCEMENT_PROMPT,
    REGENERATE_ITEM_PROMPT,
    REGENERATE_SKILLS_PROMPT,
)
from app.models.enrichment.schemas import (
    AnalysisResponse,
    AnswerInput,
    ApplyEnhancementsRequest,
    EnhancedDescription,
    EnhanceRequest,
    EnhancementPreview,
    EnrichmentItem,
    EnrichmentQuestion,
    RefineEnhancementsRequest,
    RefinementInput,
    RegenerateItemError,
    RegenerateItemInput,
    RegenerateRequest,
    RegenerateResponse,
    RegeneratedItem,
)
from app.services.language import get_language_name
from app.services.llm_helpers import llm_complete_json_async

_WORK_ITEM_PATTERN = re.compile(r"^experience-(\d+)$")
_PROJECT_ITEM_PATTERN = re.compile(r"^project-(\d+)$")
_PUBLICATION_ITEM_PATTERN = re.compile(r"^publication-(\d+)$")
_POSITION_ITEM_PATTERN = re.compile(r"^position-(\d+)$")
_CERTIFICATION_ITEM_PATTERN = re.compile(r"^certification-(\d+)$")
_ACHIEVEMENT_ITEM_PATTERN = re.compile(r"^achievement-(\d+)$")
_EDUCATION_ITEM_PATTERN = re.compile(r"^education-(\d+)$")


def _extract_bullets(value: object) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    text = str(value).strip()
    if not text:
        return []
    return [line.strip() for line in text.split("\n") if line.strip()]


def _normalize_summary(summary: object) -> str:
    if summary is None:
        return ""
    if isinstance(summary, str):
        return summary.strip()
    return str(summary).strip()


def _build_enrichment_payload(resume_data: dict) -> dict:
    items_to_enrich: list[dict] = []

    work_entries = resume_data.get("work_experience", [])
    if isinstance(work_entries, list):
        for index, entry in enumerate(work_entries):
            if not isinstance(entry, dict):
                continue
            items_to_enrich.append(
                {
                    "item_id": f"experience-{index}",
                    "item_type": "experience",
                    "title": entry.get("role", ""),
                    "subtitle": entry.get("company_and_duration"),
                    "current_description": _extract_bullets(entry.get("bullet_points")),
                }
            )

    project_entries = resume_data.get("projects", [])
    if isinstance(project_entries, list):
        for index, entry in enumerate(project_entries):
            if not isinstance(entry, dict):
                continue
            items_to_enrich.append(
                {
                    "item_id": f"project-{index}",
                    "item_type": "project",
                    "title": entry.get("title", ""),
                    "subtitle": ", ".join(entry.get("technologies_used", []) or []),
                    "current_description": _extract_bullets(entry.get("description")),
                }
            )

    publication_entries = resume_data.get("publications", [])
    if isinstance(publication_entries, list):
        for index, entry in enumerate(publication_entries):
            if not isinstance(entry, dict):
                continue
            subtitle_parts = []
            if entry.get("journal_conference"):
                subtitle_parts.append(entry["journal_conference"])
            if entry.get("year"):
                subtitle_parts.append(entry["year"])
            items_to_enrich.append(
                {
                    "item_id": f"publication-{index}",
                    "item_type": "publication",
                    "title": entry.get("title", ""),
                    "subtitle": ", ".join(subtitle_parts) if subtitle_parts else None,
                    "current_description": _extract_bullets(entry.get("authors")),
                }
            )

    position_entries = resume_data.get("positions_of_responsibility", [])
    if isinstance(position_entries, list):
        for index, entry in enumerate(position_entries):
            if not isinstance(entry, dict):
                continue
            subtitle_parts = []
            if entry.get("organization"):
                subtitle_parts.append(entry["organization"])
            if entry.get("duration"):
                subtitle_parts.append(entry["duration"])
            items_to_enrich.append(
                {
                    "item_id": f"position-{index}",
                    "item_type": "position",
                    "title": entry.get("title", ""),
                    "subtitle": ", ".join(subtitle_parts) if subtitle_parts else None,
                    "current_description": _extract_bullets(entry.get("description")),
                }
            )

    certification_entries = resume_data.get("certifications", [])
    if isinstance(certification_entries, list):
        for index, entry in enumerate(certification_entries):
            if not isinstance(entry, dict):
                continue
            subtitle_parts = []
            if entry.get("issuing_organization"):
                subtitle_parts.append(entry["issuing_organization"])
            if entry.get("issue_date"):
                subtitle_parts.append(entry["issue_date"])
            items_to_enrich.append(
                {
                    "item_id": f"certification-{index}",
                    "item_type": "certification",
                    "title": entry.get("name", ""),
                    "subtitle": ", ".join(subtitle_parts) if subtitle_parts else None,
                    "current_description": _extract_bullets(entry.get("credential_id")),
                }
            )

    achievement_entries = resume_data.get("achievements", [])
    if isinstance(achievement_entries, list):
        for index, entry in enumerate(achievement_entries):
            if not isinstance(entry, dict):
                continue
            subtitle_parts = []
            if entry.get("year"):
                subtitle_parts.append(entry["year"])
            if entry.get("category"):
                subtitle_parts.append(entry["category"])
            items_to_enrich.append(
                {
                    "item_id": f"achievement-{index}",
                    "item_type": "achievement",
                    "title": entry.get("title", ""),
                    "subtitle": ", ".join(subtitle_parts) if subtitle_parts else None,
                    "current_description": _extract_bullets(entry.get("description")),
                }
            )

    education_entries = resume_data.get("education", [])
    if isinstance(education_entries, list):
        for index, entry in enumerate(education_entries):
            if not isinstance(entry, dict):
                continue
            items_to_enrich.append(
                {
                    "item_id": f"education-{index}",
                    "item_type": "education",
                    "title": entry.get("education_detail", ""),
                    "subtitle": None,
                    "current_description": _extract_bullets(
                        entry.get("education_detail")
                    ),
                }
            )

    return {
        "summary": _normalize_summary(resume_data.get("summary")),
        "items_to_enrich": items_to_enrich,
    }


def _map_enrichment_item_id(item_id: str) -> tuple[str, int | None]:
    work_match = _WORK_ITEM_PATTERN.match(item_id)
    if work_match:
        return "experience", int(work_match.group(1))
    project_match = _PROJECT_ITEM_PATTERN.match(item_id)
    if project_match:
        return "project", int(project_match.group(1))
    publication_match = _PUBLICATION_ITEM_PATTERN.match(item_id)
    if publication_match:
        return "publication", int(publication_match.group(1))
    position_match = _POSITION_ITEM_PATTERN.match(item_id)
    if position_match:
        return "position", int(position_match.group(1))
    certification_match = _CERTIFICATION_ITEM_PATTERN.match(item_id)
    if certification_match:
        return "certification", int(certification_match.group(1))
    achievement_match = _ACHIEVEMENT_ITEM_PATTERN.match(item_id)
    if achievement_match:
        return "achievement", int(achievement_match.group(1))
    education_match = _EDUCATION_ITEM_PATTERN.match(item_id)
    if education_match:
        return "education", int(education_match.group(1))
    return "", None


logger = logging.getLogger(__name__)


async def analyze_resume_enrichment(
    resume_data: dict,
    *,
    llm,
    language: str = "en",
) -> AnalysisResponse:
    enrich_payload = _build_enrichment_payload(resume_data)
    resume_json = json.dumps(enrich_payload, indent=2, ensure_ascii=True)
    output_language = get_language_name(language)
    prompt = ANALYZE_RESUME_PROMPT.format(
        resume_json=resume_json,
        output_language=output_language,
    )

    result = await llm_complete_json_async(llm=llm, prompt=prompt, max_tokens=8192)

    items_to_enrich = [
        EnrichmentItem(
            item_id=item.get("item_id", f"item_{i}"),
            item_type=item.get("item_type", "experience"),
            title=item.get("title", ""),
            subtitle=item.get("subtitle"),
            current_description=item.get("current_description", []),
            weakness_reason=item.get("weakness_reason", ""),
        )
        for i, item in enumerate(result.get("items_to_enrich", []))
    ]

    questions = [
        EnrichmentQuestion(
            question_id=q.get("question_id", f"q_{i}"),
            item_id=q.get("item_id", ""),
            question=q.get("question", ""),
            placeholder=q.get("placeholder", ""),
        )
        for i, q in enumerate(result.get("questions", []))
    ]

    return AnalysisResponse(
        items_to_enrich=items_to_enrich,
        questions=questions,
        analysis_summary=result.get("analysis_summary"),
    )


async def generate_enhancements_preview(
    resume_data: dict,
    request: EnhanceRequest,
    *,
    llm,
    language: str = "en",
) -> EnhancementPreview:
    enrich_payload = _build_enrichment_payload(resume_data)
    resume_json = json.dumps(enrich_payload, indent=2, ensure_ascii=True)
    output_language = get_language_name(language)
    analysis_prompt = ANALYZE_RESUME_PROMPT.format(
        resume_json=resume_json,
        output_language=output_language,
    )

    analysis_result = await llm_complete_json_async(
        llm=llm,
        prompt=analysis_prompt,
        max_tokens=8192,
    )

    question_to_item: dict[str, str] = {}
    question_details: dict[str, dict] = {}
    for q in analysis_result.get("questions", []):
        qid = q.get("question_id", "")
        question_to_item[qid] = q.get("item_id", "")
        question_details[qid] = q

    item_details: dict[str, dict] = {}
    for item in analysis_result.get("items_to_enrich", []):
        item_id = item.get("item_id", "")
        item_details[item_id] = item

    answers_by_item: dict[str, list[AnswerInput]] = {}
    for answer in request.answers:
        item_id = question_to_item.get(answer.question_id, "")
        if item_id:
            answers_by_item.setdefault(item_id, []).append(answer)

    # Build full resume context string (condensed for the LLM)
    resume_context = json.dumps(resume_data, indent=1, ensure_ascii=False)

    enhancements: list[EnhancedDescription] = []

    for item_id, answers in answers_by_item.items():
        item = item_details.get(item_id, {})
        if not item:
            continue

        item_questions = [
            q
            for q in analysis_result.get("questions", [])
            if q.get("item_id") == item_id
        ]

        # Build Q&A text with full question context
        answers_text = ""
        questions_context_text = ""
        for answer in answers:
            matching_q = next(
                (
                    q
                    for q in item_questions
                    if q.get("question_id") == answer.question_id
                ),
                None,
            )
            if matching_q:
                answers_text += f"Q: {matching_q.get('question', '')}\n"
                answers_text += f"A: {answer.answer}\n\n"
                questions_context_text += (
                    f"- Question: {matching_q.get('question', '')}\n"
                    f"  Why this was asked: To address the weakness -- "
                    f"{item.get('weakness_reason', 'improve description quality')}\n"
                    f"  Candidate's answer: {answer.answer}\n\n"
                )
            else:
                answers_text += f"Additional info: {answer.answer}\n\n"

        current_desc = item.get("current_description", [])
        current_desc_text = (
            "\n".join(f"- {d}" for d in current_desc)
            if current_desc
            else "(No description)"
        )

        prompt = ENHANCE_DESCRIPTION_PROMPT.format(
            item_type=item.get("item_type", "experience"),
            title=item.get("title", ""),
            subtitle=item.get("subtitle", ""),
            current_description=current_desc_text,
            answers=answers_text.strip(),
            resume_context=resume_context,
            questions_context=questions_context_text.strip()
            or "(No specific question context)",
            output_language=output_language,
        )

        try:
            result = await llm_complete_json_async(llm=llm, prompt=prompt)
            additional_bullets = result.get("additional_bullets", [])
            if not additional_bullets:
                additional_bullets = result.get("enhanced_description", [])

            enhancements.append(
                EnhancedDescription(
                    item_id=item_id,
                    item_type=item.get("item_type", "experience"),
                    title=item.get("title", ""),
                    original_description=current_desc,
                    enhanced_description=additional_bullets,
                )
            )
        except Exception as error:
            logger.warning("Failed to enhance item %s: %s", item_id, error)

    return EnhancementPreview(enhancements=enhancements)


async def refine_enhancements(
    resume_data: dict,
    request: RefineEnhancementsRequest,
    *,
    llm,
    language: str = "en",
) -> EnhancementPreview:
    """Re-generate rejected enhancements using user feedback."""
    output_language = get_language_name(language)
    resume_context = json.dumps(resume_data, indent=1, ensure_ascii=False)

    enhancements: list[EnhancedDescription] = []

    for refinement in request.refinements:
        current_desc_text = (
            "\n".join(f"- {d}" for d in refinement.original_description)
            if refinement.original_description
            else "(No description)"
        )

        rejected_bullets_text = (
            "\n".join(f"- {b}" for b in refinement.rejected_enhancement)
            if refinement.rejected_enhancement
            else "(No rejected bullets)"
        )

        prompt = REFINE_ENHANCEMENT_PROMPT.format(
            item_type=refinement.item_type,
            title=refinement.title,
            subtitle=refinement.subtitle or "",
            current_description=current_desc_text,
            rejected_bullets=rejected_bullets_text,
            user_feedback=refinement.user_feedback,
            resume_context=resume_context,
            output_language=output_language,
        )

        try:
            result = await llm_complete_json_async(llm=llm, prompt=prompt)
            additional_bullets = result.get("additional_bullets", [])
            if not additional_bullets:
                additional_bullets = result.get("enhanced_description", [])

            enhancements.append(
                EnhancedDescription(
                    item_id=refinement.item_id,
                    item_type=refinement.item_type,
                    title=refinement.title,
                    original_description=refinement.original_description,
                    enhanced_description=additional_bullets,
                )
            )
        except Exception as error:
            logger.warning("Failed to refine item %s: %s", refinement.item_id, error)

    return EnhancementPreview(enhancements=enhancements)


def apply_enhancements_to_resume(
    resume_data: dict,
    request: ApplyEnhancementsRequest,
) -> dict:
    updated_data = copy.deepcopy(resume_data)

    for enhancement in request.enhancements:
        item_id = enhancement.item_id
        item_type = enhancement.item_type
        additional_bullets = enhancement.enhanced_description

        if item_type == "experience":
            _, index = _map_enrichment_item_id(item_id)
            if index is None:
                logger.warning("Could not parse experience item id %s", item_id)
                continue
            if "work_experience" in updated_data and index < len(
                updated_data["work_experience"]
            ):
                existing_desc = updated_data["work_experience"][index].get(
                    "bullet_points", []
                )
                if isinstance(existing_desc, list):
                    updated_data["work_experience"][index]["bullet_points"] = (
                        existing_desc + additional_bullets
                    )
                else:
                    updated_data["work_experience"][index]["bullet_points"] = (
                        [existing_desc] + additional_bullets
                        if existing_desc
                        else additional_bullets
                    )
            else:
                logger.warning("Could not apply experience enhancement %s", item_id)

        elif item_type == "project":
            _, index = _map_enrichment_item_id(item_id)
            if index is None:
                logger.warning("Could not parse project item id %s", item_id)
                continue
            if "projects" in updated_data and index < len(updated_data["projects"]):
                existing_desc = updated_data["projects"][index].get("description", [])
                if isinstance(existing_desc, list):
                    updated_data["projects"][index]["description"] = (
                        existing_desc + additional_bullets
                    )
                else:
                    updated_data["projects"][index]["description"] = (
                        [existing_desc] + additional_bullets
                        if existing_desc
                        else additional_bullets
                    )
            else:
                logger.warning("Could not apply project enhancement %s", item_id)

        elif item_type == "publication":
            _, index = _map_enrichment_item_id(item_id)
            if index is None:
                logger.warning("Could not parse publication item id %s", item_id)
                continue
            if "publications" in updated_data and index < len(
                updated_data["publications"]
            ):
                entry = updated_data["publications"][index]
                existing = entry.get("authors", "") or ""
                new_text = "; ".join(additional_bullets)
                entry["authors"] = f"{existing}; {new_text}" if existing else new_text
            else:
                logger.warning("Could not apply publication enhancement %s", item_id)

        elif item_type == "position":
            _, index = _map_enrichment_item_id(item_id)
            if index is None:
                logger.warning("Could not parse position item id %s", item_id)
                continue
            if "positions_of_responsibility" in updated_data and index < len(
                updated_data["positions_of_responsibility"]
            ):
                entry = updated_data["positions_of_responsibility"][index]
                existing = entry.get("description", "") or ""
                new_text = " ".join(additional_bullets)
                entry["description"] = (
                    f"{existing} {new_text}".strip() if existing else new_text
                )
            else:
                logger.warning("Could not apply position enhancement %s", item_id)

        elif item_type == "certification":
            _, index = _map_enrichment_item_id(item_id)
            if index is None:
                logger.warning("Could not parse certification item id %s", item_id)
                continue
            if "certifications" in updated_data and index < len(
                updated_data["certifications"]
            ):
                entry = updated_data["certifications"][index]
                existing = entry.get("credential_id", "") or ""
                new_text = "; ".join(additional_bullets)
                entry["credential_id"] = (
                    f"{existing}; {new_text}" if existing else new_text
                )
            else:
                logger.warning("Could not apply certification enhancement %s", item_id)

        elif item_type == "achievement":
            _, index = _map_enrichment_item_id(item_id)
            if index is None:
                logger.warning("Could not parse achievement item id %s", item_id)
                continue
            if "achievements" in updated_data and index < len(
                updated_data["achievements"]
            ):
                entry = updated_data["achievements"][index]
                existing = entry.get("description", "") or ""
                new_text = " ".join(additional_bullets)
                entry["description"] = (
                    f"{existing} {new_text}".strip() if existing else new_text
                )
            else:
                logger.warning("Could not apply achievement enhancement %s", item_id)

        elif item_type == "education":
            _, index = _map_enrichment_item_id(item_id)
            if index is None:
                logger.warning("Could not parse education item id %s", item_id)
                continue
            if "education" in updated_data and index < len(updated_data["education"]):
                entry = updated_data["education"][index]
                existing = entry.get("education_detail", "") or ""
                new_text = " ".join(additional_bullets)
                entry["education_detail"] = (
                    f"{existing} {new_text}".strip() if existing else new_text
                )
            else:
                logger.warning("Could not apply education enhancement %s", item_id)

    return updated_data


async def regenerate_items(
    request: RegenerateRequest,
    *,
    llm,
) -> RegenerateResponse:
    output_language = get_language_name(request.output_language)

    tasks = []
    for item in request.items:
        if item.item_type == "skills":
            tasks.append(
                _regenerate_skills(item, request.instruction, output_language, llm=llm)
            )
        else:
            tasks.append(
                _regenerate_experience_or_project(
                    item, request.instruction, output_language, llm=llm
                )
            )

    results = await _gather_results(tasks)

    regenerated_items: list[RegeneratedItem] = []
    errors: list[RegenerateItemError] = []

    for item, result in zip(request.items, results):
        if isinstance(result, Exception):
            logger.error("Failed to regenerate item: %s", item.item_id, exc_info=result)
            errors.append(
                RegenerateItemError(
                    item_id=item.item_id,
                    item_type=item.item_type,
                    title=item.title,
                    subtitle=item.subtitle,
                    message="Failed to regenerate this item. Please try again.",
                )
            )
            continue

        regenerated_items.append(result)

    return RegenerateResponse(regenerated_items=regenerated_items, errors=errors)


async def apply_regenerated_items(
    resume_data: dict,
    regenerated_items: list[RegeneratedItem],
) -> dict:
    updated_data = copy.deepcopy(resume_data)

    def _normalize_match_value(value: str | None) -> str:
        return (value or "").strip().casefold()

    def _normalize_lines(value: object) -> list[str]:
        if value is None:
            return []
        if isinstance(value, list):
            normalized: list[str] = []
            for entry in value:
                text = str(entry).strip()
                if text:
                    normalized.append(text)
            return normalized
        text = str(value).strip()
        return [text] if text else []

    def _lines_equal(left: object, right: object) -> bool:
        left_norm = [line.casefold() for line in _normalize_lines(left)]
        right_norm = [line.casefold() for line in _normalize_lines(right)]
        return left_norm == right_norm

    def _find_unique_index_by_metadata(
        entries: list[dict],
        *,
        title_key: str,
        subtitle_key: str,
        expected_title: str,
        expected_subtitle: str | None,
        expected_original_content: list[str],
        content_key: str,
    ) -> int | None:
        expected_title_norm = _normalize_match_value(expected_title)
        expected_subtitle_norm = _normalize_match_value(expected_subtitle)

        if not expected_title_norm:
            return None

        matches: list[int] = []
        for i, entry in enumerate(entries):
            if not isinstance(entry, dict):
                continue
            entry_title = _normalize_match_value(str(entry.get(title_key, "")))
            entry_subtitle = _normalize_match_value(str(entry.get(subtitle_key, "")))

            if entry_title != expected_title_norm:
                continue
            if expected_subtitle_norm and entry_subtitle != expected_subtitle_norm:
                continue
            matches.append(i)

        if len(matches) == 1:
            return matches[0]

        matches_by_content = [
            i
            for i in matches
            if _lines_equal(entries[i].get(content_key), expected_original_content)
        ]
        if len(matches_by_content) == 1:
            return matches_by_content[0]

        return None

    def _parse_index(item_id: str, pattern: str) -> int | None:
        match = re.fullmatch(pattern, item_id)
        if not match:
            return None
        return int(match.group(1))

    apply_failures: list[str] = []

    for item in regenerated_items:
        item_id = item.item_id
        item_type = item.item_type
        new_content = item.new_content

        if item_type == "experience":
            experiences = updated_data.get("work_experience", [])
            if not isinstance(experiences, list):
                apply_failures.append(item_id)
                continue

            index = _parse_index(item_id, r"experience-(\d+)")
            if index is None:
                apply_failures.append(item_id)
                continue

            expected_title = item.title
            expected_company = item.subtitle
            expected_original_content = item.original_content

            resolved_index: int | None = None
            if 0 <= index < len(experiences):
                entry = (
                    experiences[index] if isinstance(experiences[index], dict) else {}
                )
                entry_title = _normalize_match_value(str(entry.get("role", "")))
                entry_company = _normalize_match_value(
                    str(entry.get("company_and_duration", ""))
                )
                if (
                    entry_title == _normalize_match_value(expected_title)
                    and (
                        not _normalize_match_value(expected_company)
                        or entry_company == _normalize_match_value(expected_company)
                    )
                    and _lines_equal(
                        entry.get("bullet_points"), expected_original_content
                    )
                ):
                    resolved_index = index

            if resolved_index is None:
                resolved_index = _find_unique_index_by_metadata(
                    experiences,
                    title_key="role",
                    subtitle_key="company_and_duration",
                    expected_title=expected_title,
                    expected_subtitle=expected_company,
                    expected_original_content=expected_original_content,
                    content_key="bullet_points",
                )

            if resolved_index is None:
                apply_failures.append(item_id)
                continue

            entry = experiences[resolved_index]
            if isinstance(entry, dict):
                if not _lines_equal(
                    entry.get("bullet_points"), expected_original_content
                ):
                    apply_failures.append(item_id)
                    continue
                entry["bullet_points"] = new_content
            else:
                apply_failures.append(item_id)

        elif item_type == "project":
            projects = updated_data.get("projects", [])
            if not isinstance(projects, list):
                apply_failures.append(item_id)
                continue

            index = _parse_index(item_id, r"project-(\d+)")
            if index is None:
                apply_failures.append(item_id)
                continue

            expected_name = item.title
            expected_role = item.subtitle
            expected_original_content = item.original_content

            resolved_index = None
            if 0 <= index < len(projects):
                entry = projects[index] if isinstance(projects[index], dict) else {}
                entry_name = _normalize_match_value(str(entry.get("title", "")))
                entry_role = _normalize_match_value(
                    ", ".join(entry.get("technologies_used", []) or [])
                )
                if (
                    entry_name == _normalize_match_value(expected_name)
                    and (
                        not _normalize_match_value(expected_role)
                        or entry_role == _normalize_match_value(expected_role)
                    )
                    and _lines_equal(
                        entry.get("description"), expected_original_content
                    )
                ):
                    resolved_index = index

            if resolved_index is None:
                resolved_index = _find_unique_index_by_metadata(
                    projects,
                    title_key="title",
                    subtitle_key="technologies_used",
                    expected_title=expected_name,
                    expected_subtitle=expected_role,
                    expected_original_content=expected_original_content,
                    content_key="description",
                )

            if resolved_index is None:
                apply_failures.append(item_id)
                continue

            entry = projects[resolved_index]
            if isinstance(entry, dict):
                if not _lines_equal(
                    entry.get("description"), expected_original_content
                ):
                    apply_failures.append(item_id)
                    continue
                entry["description"] = new_content
            else:
                apply_failures.append(item_id)

        elif item_type == "skills":
            expected_original_content = item.original_content

            skills = updated_data.get("skills_analysis", [])
            if not isinstance(skills, list):
                apply_failures.append(item_id)
                continue
            current_skills = [
                entry.get("skill_name")
                for entry in skills
                if isinstance(entry, dict) and entry.get("skill_name")
            ]
            if not _lines_equal(current_skills, expected_original_content):
                apply_failures.append(item_id)
                continue
            updated_data["skills_analysis"] = [
                {
                    "skill_name": skill,
                    "percentage": skills[index].get("percentage", 80)
                    if index < len(skills) and isinstance(skills[index], dict)
                    else 80,
                }
                for index, skill in enumerate(new_content)
            ]

        elif item_type == "publication":
            publications = updated_data.get("publications", [])
            if not isinstance(publications, list):
                apply_failures.append(item_id)
                continue

            index = _parse_index(item_id, r"publication-(\d+)")
            if index is None:
                apply_failures.append(item_id)
                continue

            resolved_index = None
            if 0 <= index < len(publications):
                entry = (
                    publications[index] if isinstance(publications[index], dict) else {}
                )
                entry_title = _normalize_match_value(str(entry.get("title", "")))
                if entry_title == _normalize_match_value(item.title):
                    resolved_index = index

            if resolved_index is None:
                resolved_index = _find_unique_index_by_metadata(
                    publications,
                    title_key="title",
                    subtitle_key="journal_conference",
                    expected_title=item.title,
                    expected_subtitle=item.subtitle,
                    expected_original_content=item.original_content,
                    content_key="authors",
                )

            if resolved_index is None:
                apply_failures.append(item_id)
                continue

            entry = publications[resolved_index]
            if isinstance(entry, dict):
                new_text = " ".join(new_content).strip()
                entry["authors"] = new_text if new_text else entry.get("authors", "")
            else:
                apply_failures.append(item_id)

        elif item_type == "position":
            positions = updated_data.get("positions_of_responsibility", [])
            if not isinstance(positions, list):
                apply_failures.append(item_id)
                continue

            index = _parse_index(item_id, r"position-(\d+)")
            if index is None:
                apply_failures.append(item_id)
                continue

            resolved_index = None
            if 0 <= index < len(positions):
                entry = positions[index] if isinstance(positions[index], dict) else {}
                entry_title = _normalize_match_value(str(entry.get("title", "")))
                if entry_title == _normalize_match_value(item.title):
                    resolved_index = index

            if resolved_index is None:
                resolved_index = _find_unique_index_by_metadata(
                    positions,
                    title_key="title",
                    subtitle_key="organization",
                    expected_title=item.title,
                    expected_subtitle=item.subtitle,
                    expected_original_content=item.original_content,
                    content_key="description",
                )

            if resolved_index is None:
                apply_failures.append(item_id)
                continue

            entry = positions[resolved_index]
            if isinstance(entry, dict):
                new_text = " ".join(new_content).strip()
                entry["description"] = (
                    new_text if new_text else entry.get("description", "")
                )
            else:
                apply_failures.append(item_id)

        elif item_type == "certification":
            certifications = updated_data.get("certifications", [])
            if not isinstance(certifications, list):
                apply_failures.append(item_id)
                continue

            index = _parse_index(item_id, r"certification-(\d+)")
            if index is None:
                apply_failures.append(item_id)
                continue

            resolved_index = None
            if 0 <= index < len(certifications):
                entry = (
                    certifications[index]
                    if isinstance(certifications[index], dict)
                    else {}
                )
                entry_name = _normalize_match_value(str(entry.get("name", "")))
                if entry_name == _normalize_match_value(item.title):
                    resolved_index = index

            if resolved_index is None:
                resolved_index = _find_unique_index_by_metadata(
                    certifications,
                    title_key="name",
                    subtitle_key="issuing_organization",
                    expected_title=item.title,
                    expected_subtitle=item.subtitle,
                    expected_original_content=item.original_content,
                    content_key="credential_id",
                )

            if resolved_index is None:
                apply_failures.append(item_id)
                continue

            entry = certifications[resolved_index]
            if isinstance(entry, dict):
                new_text = " ".join(new_content).strip()
                entry["credential_id"] = (
                    new_text if new_text else entry.get("credential_id", "")
                )
            else:
                apply_failures.append(item_id)

        elif item_type == "achievement":
            achievements = updated_data.get("achievements", [])
            if not isinstance(achievements, list):
                apply_failures.append(item_id)
                continue

            index = _parse_index(item_id, r"achievement-(\d+)")
            if index is None:
                apply_failures.append(item_id)
                continue

            resolved_index = None
            if 0 <= index < len(achievements):
                entry = (
                    achievements[index] if isinstance(achievements[index], dict) else {}
                )
                entry_title = _normalize_match_value(str(entry.get("title", "")))
                if entry_title == _normalize_match_value(item.title):
                    resolved_index = index

            if resolved_index is None:
                resolved_index = _find_unique_index_by_metadata(
                    achievements,
                    title_key="title",
                    subtitle_key="category",
                    expected_title=item.title,
                    expected_subtitle=item.subtitle,
                    expected_original_content=item.original_content,
                    content_key="description",
                )

            if resolved_index is None:
                apply_failures.append(item_id)
                continue

            entry = achievements[resolved_index]
            if isinstance(entry, dict):
                new_text = " ".join(new_content).strip()
                entry["description"] = (
                    new_text if new_text else entry.get("description", "")
                )
            else:
                apply_failures.append(item_id)

        elif item_type == "education":
            education = updated_data.get("education", [])
            if not isinstance(education, list):
                apply_failures.append(item_id)
                continue

            index = _parse_index(item_id, r"education-(\d+)")
            if index is None:
                apply_failures.append(item_id)
                continue

            if 0 <= index < len(education):
                entry = education[index]
                if isinstance(entry, dict):
                    new_text = " ".join(new_content).strip()
                    entry["education_detail"] = (
                        new_text if new_text else entry.get("education_detail", "")
                    )
                else:
                    apply_failures.append(item_id)
            else:
                apply_failures.append(item_id)

    if apply_failures:
        raise ValueError(
            "Resume content changed or could not be uniquely matched. Please regenerate and try again."
        )

    return updated_data


async def _regenerate_experience_or_project(
    item: RegenerateItemInput,
    instruction: str,
    output_language: str,
    *,
    llm,
) -> RegeneratedItem:
    current_desc_text = (
        "\n".join(f"- {d}" for d in item.current_content)
        if item.current_content
        else "(No description)"
    )

    prompt = REGENERATE_ITEM_PROMPT.format(
        output_language=output_language,
        item_type=item.item_type,
        title=item.title,
        subtitle=item.subtitle or "",
        current_description=current_desc_text,
        user_instruction=instruction,
    )

    result = await llm_complete_json_async(llm=llm, prompt=prompt, max_tokens=4096)

    return RegeneratedItem(
        item_id=item.item_id,
        item_type=item.item_type,
        title=item.title,
        subtitle=item.subtitle,
        original_content=item.current_content,
        new_content=result.get("new_bullets", []),
        diff_summary=result.get("change_summary", ""),
    )


async def _regenerate_skills(
    item: RegenerateItemInput,
    instruction: str,
    output_language: str,
    *,
    llm,
) -> RegeneratedItem:
    current_skills_text = (
        ", ".join(item.current_content) if item.current_content else "(No skills)"
    )

    prompt = REGENERATE_SKILLS_PROMPT.format(
        output_language=output_language,
        current_skills=current_skills_text,
        user_instruction=instruction,
    )

    result = await llm_complete_json_async(llm=llm, prompt=prompt, max_tokens=2048)

    return RegeneratedItem(
        item_id=item.item_id,
        item_type=item.item_type,
        title=item.title,
        subtitle=item.subtitle,
        original_content=item.current_content,
        new_content=result.get("new_skills", []),
        diff_summary=result.get("change_summary", ""),
    )


async def _gather_results(tasks):
    results = []
    for task in tasks:
        try:
            result = await task
            results.append(result)
        except Exception as error:
            results.append(error)
    return results
