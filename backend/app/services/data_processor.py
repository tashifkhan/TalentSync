import json
import logging
import re

from langchain_core.language_models import BaseChatModel

from app.data.prompt.ats_analysis import build_ats_analysis_chain
from app.data.prompt.comprehensive_analysis import build_comprehensive_analysis_chain
from app.data.prompt.format_analyse import build_format_analyse_chain
from app.data.prompt.json_extractor import build_json_formatter_chain
from app.data.prompt.resume_refinement import (
    AI_PHRASE_REPLACEMENTS,
    build_validation_polish_chain,
)
from app.services.llm_helpers import _extract_text_from_llm_result, parse_llm_json
from app.data.prompt.txt_processor import build_text_formatter_chain


class LLMNotFoundError(Exception):
    """Exception raised when the specified LLM provider or model is not found."""

    def __init__(self, message="LLM provider or model not found"):
        super().__init__(message)


def format_resume_text_with_llm(
    raw_text: str,
    llm: BaseChatModel,
) -> str:
    """Formats the extracted resume text using an LLM."""

    if not raw_text.strip():
        return ""

    try:
        chain = build_text_formatter_chain(llm)
        result = chain.invoke(
            {
                "raw_resume_text": raw_text,
            }
        )
        try:
            formatted_text = (
                result if isinstance(result, str) else getattr(result, "content", "")
            )
        except:
            formatted_text = str(result.content)
        return formatted_text.strip()

    except ValueError as ve:
        error_msg = str(ve)
        return raw_text

    except Exception as e:
        error_msg = f"Error formatting resume text: {str(e)}"

        if "rate limit" in str(e).lower():
            error_msg += "\nYou may have hit API rate limits. Using original text."

        elif "authentication" in str(e).lower() or "unauthorized" in str(e).lower():
            error_msg += "\nAPI authentication issue. Using original text."

        return raw_text


def format_resume_json_with_llm(
    extracted_resume_text: str,
    llm: BaseChatModel,
) -> dict | None:
    """Formats the extracted resume JSON using an LLM."""

    try:
        chain = build_json_formatter_chain(llm)
        result = chain.invoke(
            {
                "extracted_resume_text": extracted_resume_text,
            }
        )
        result = str(result.content)

        if result.strip().startswith("```json"):
            result = result.strip().removeprefix("```json").removesuffix("```").strip()
            loaded = json.loads(result)

            if not isinstance(loaded, dict):
                return {}

            return loaded

        elif result.strip().startswith("{"):
            result = result.strip()
            loaded = json.loads(result)

            if not isinstance(loaded, dict):
                return {}

            return loaded

        else:
            result = result.strip()
            start_index = result.find("{")
            end_index = result.rfind("}") + 1
            result = result[start_index:end_index]
            error_flag = len(result) < 0

            try:
                loaded = json.loads(result)
                if not isinstance(loaded, dict):
                    return {}
                return loaded

            except json.JSONDecodeError:
                error_flag = True

            if error_flag:
                print(
                    "Error formatting resume JSON: Invalid JSON format in LLM response."
                )
                return {}

    except ValueError as ve:
        error_msg = str(ve)
        print(f"ValueError in format_resume_json_with_llm: {error_msg}")
        return {}

    except Exception as e:
        error_msg = f"Error formatting resume JSON: {str(e)}"
        print(f"Exception in format_resume_json_with_llm: {error_msg}")
        return {}


_extract_text_from_llm_result = _extract_text_from_llm_result


_AI_REPLACEMENT_KEYS = tuple(
    sorted(AI_PHRASE_REPLACEMENTS.keys(), key=len, reverse=True)
)
_AI_REPLACEMENT_ALLOWED_KEYS = {
    "bullet_points",
    "description",
}


def _replace_ai_phrases(text: str) -> str:
    if not text:
        return text

    updated = text
    for phrase in _AI_REPLACEMENT_KEYS:
        replacement = AI_PHRASE_REPLACEMENTS[phrase]
        if any(char.isalnum() for char in phrase):
            pattern = re.compile(r"\b" + re.escape(phrase) + r"\b", re.IGNORECASE)
        else:
            pattern = re.compile(re.escape(phrase))

        def _replace(match: re.Match) -> str:
            matched_text = match.group(0)
            if matched_text.isupper():
                return replacement.upper()
            if matched_text[:1].isupper():
                return replacement[:1].upper() + replacement[1:]
            return replacement

        updated = pattern.sub(_replace, updated)

    updated = re.sub(r"\s{2,}", " ", updated).strip()
    return updated


def _apply_ai_phrase_replacements(value: dict) -> dict:
    if not isinstance(value, dict):
        return {}

    def _walk(node, key: str | None = None):
        if isinstance(node, dict):
            return {k: _walk(v, k) for k, v in node.items()}
        if isinstance(node, list):
            return [_walk(item, key) for item in node]
        if isinstance(node, str) and key in _AI_REPLACEMENT_ALLOWED_KEYS:
            return _replace_ai_phrases(node)
        return node

    return _walk(value)


def comprehensive_analysis_llm(
    resume_text: str,
    llm: BaseChatModel,
) -> dict | None:
    """Performs a comprehensive analysis of the resume using LLM."""

    if not resume_text:
        return {}

    chain = build_comprehensive_analysis_chain(llm)
    result = chain.invoke(
        {
            "extracted_resume_text": resume_text,
        }
    )
    if isinstance(result, dict):
        formatted_json = result

    else:
        raw_responce = _extract_text_from_llm_result(result)
        if raw_responce.strip().startswith("```json"):
            result = (
                raw_responce.strip().removeprefix("```json").removesuffix("```").strip()
            )
            try:
                formatted_json = json.loads(result)

            except json.JSONDecodeError as e:
                logging.error(
                    f"Failed to parse JSON from LLM response (```json block): {e}"
                )
                logging.error(f"Raw response: {raw_responce[:500]}")
                formatted_json = {}

        elif raw_responce.strip().startswith("{"):
            result = raw_responce.strip()
            try:
                formatted_json = json.loads(result)

            except json.JSONDecodeError as e:
                logging.error(
                    f"Failed to parse JSON from LLM response (direct JSON): {e}"
                )
                logging.error(f"Raw response: {raw_responce[:500]}")
                formatted_json = {}

        else:
            result = raw_responce.strip()
            start_index = result.find("{")
            end_index = result.rfind("}") + 1
            result = result[start_index:end_index]
            try:
                formatted_json = json.loads(result)

            except json.JSONDecodeError as e:
                logging.error(
                    f"Failed to parse JSON from LLM response (extracted block): {e}"
                )
                logging.error(f"Raw response: {raw_responce[:500]}")
                formatted_json = {}

        if formatted_json is None or not isinstance(formatted_json, dict):
            logging.error(f"LLM returned non-dict result: {type(formatted_json)}")
            return {}

        return formatted_json

    if (
        not formatted_json
        and isinstance(result, str)
        and result.strip().startswith("```json")
    ):
        try:
            json_str = (
                result.strip().removeprefix("```json").removesuffix("```").strip()
            )
            formatted_json = json.loads(json_str)

        except Exception as e:
            logging.error(f"Failed to parse JSON in final fallback: {e}")
            formatted_json = {}

    return formatted_json


def format_and_analyse_resumes(
    raw_text: str,
    llm: BaseChatModel,
) -> dict:
    """Formats and analyses the resume text and JSON using LLM."""

    if not raw_text.strip():
        return {}

    chain = build_format_analyse_chain(llm)
    result = chain.invoke(
        {
            "extracted_resume_text": raw_text,
        }
    )
    if isinstance(result, dict):
        formatted_json = result

    else:
        raw_responce = _extract_text_from_llm_result(result)
        if raw_responce.strip().startswith("```json"):
            result = (
                raw_responce.strip().removeprefix("```json").removesuffix("```").strip()
            )
            try:
                formatted_json = json.loads(result)

            except json.JSONDecodeError:
                formatted_json = {}

        elif raw_responce.strip().startswith("{"):
            result = raw_responce.strip()
            try:
                formatted_json = json.loads(result)

            except json.JSONDecodeError:
                formatted_json = {}

        else:
            result = raw_responce.strip()
            start_index = result.find("{")
            end_index = result.rfind("}") + 1
            result = result[start_index:end_index]
            try:
                formatted_json = json.loads(result)

            except json.JSONDecodeError:
                formatted_json = {}

        if formatted_json is None or not isinstance(formatted_json, dict):
            return {}

        return formatted_json

    if (
        not formatted_json
        and isinstance(result, str)
        and result.strip().startswith("```json")
    ):
        try:
            json_str = (
                result.strip().removeprefix("```json").removesuffix("```").strip()
            )
            formatted_json = json.loads(json_str)

        except Exception:
            formatted_json = {}

    if formatted_json is None or not isinstance(formatted_json, dict):
        return {}

    return formatted_json


def polish_resume_json_with_llm(
    resume_json: dict,
    master_resume: str,
    llm: BaseChatModel | None,
) -> dict:
    if not resume_json:
        return {}

    polished = resume_json

    if llm is not None:
        chain = build_validation_polish_chain(llm)
        result = chain.invoke(
            {
                "resume": json.dumps(resume_json, ensure_ascii=True),
                "master_resume": master_resume,
            }
        )
        raw_response = _extract_text_from_llm_result(result)
        parsed = parse_llm_json(raw_response)
        if isinstance(parsed, dict) and parsed:
            polished = parsed

    replaced = _apply_ai_phrase_replacements(polished)
    if isinstance(replaced, dict):
        return replaced
    if isinstance(polished, dict):
        return polished
    return {}


def ats_analysis_llm(resume_text: str, jd_text: str, llm: BaseChatModel) -> dict:
    """Performs ATS scoring and analysis using LLM."""
    if not resume_text.strip() or not jd_text.strip():
        return {}
    chain = build_ats_analysis_chain(llm)
    result = chain.invoke(
        {
            "resume_text": resume_text,
            "jd_text": jd_text,
        }
    )
    if isinstance(result, dict):
        return result
    raw_response = str(result.content) if hasattr(result, "content") else str(result)
    if raw_response.strip().startswith("```json"):
        raw_response = raw_response.strip().removeprefix("```json").removesuffix("```")
    try:
        parsed = json.loads(raw_response)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass
    # fallback: try to extract JSON substring
    start = raw_response.find("{")
    end = raw_response.rfind("}") + 1
    if start != -1 and end != -1:
        try:
            parsed = json.loads(raw_response[start:end])
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
    return {}
