"""Structured resume data models used for tailoring and refinement."""

import copy
import re
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator

_TEXT_VALUE_KEYS = (
    "text",
    "summary",
    "description",
    "value",
    "content",
    "title",
    "subtitle",
    "name",
    "label",
)
_BULLET_PREFIX_RE = re.compile(r"^\s*(?:[-*\u2022]+|\d+[.)])\s*")


def _extract_text_fragments(
    value: Any, depth: int = 0, max_depth: int = 10
) -> list[str]:
    if depth >= max_depth or value is None:
        return []

    if isinstance(value, str):
        stripped = value.strip()
        return [stripped] if stripped else []

    if isinstance(value, (int, float)):
        return [str(value)]

    if isinstance(value, list):
        fragments: list[str] = []
        for item in value:
            fragments.extend(_extract_text_fragments(item, depth + 1, max_depth))
        return fragments

    if isinstance(value, dict):
        fragments: list[str] = []

        for key in _TEXT_VALUE_KEYS:
            if key in value:
                fragments.extend(
                    _extract_text_fragments(value.get(key), depth + 1, max_depth)
                )

        if fragments:
            return fragments

        for nested in value.values():
            fragments.extend(_extract_text_fragments(nested, depth + 1, max_depth))
        return fragments

    return []


def _coerce_text(value: Any, joiner: str = " ") -> str:
    return joiner.join(_extract_text_fragments(value)).strip()


def _coerce_optional_text(value: Any) -> str | None:
    if value is None:
        return None
    text = _coerce_text(value)
    return text or None


def _split_description_lines(value: str) -> list[str]:
    items: list[str] = []
    for raw_line in re.split(r"\r?\n+", value):
        line = _BULLET_PREFIX_RE.sub("", raw_line.strip())
        if line:
            items.append(line)
    return items


def _coerce_string_list(value: Any) -> list[str]:
    if value is None:
        return []

    if isinstance(value, str):
        return _split_description_lines(value)

    if isinstance(value, list):
        items: list[str] = []
        for entry in value:
            if isinstance(entry, str):
                items.extend(_split_description_lines(entry))
                continue

            coerced = _coerce_text(entry)
            if coerced:
                items.append(coerced)
        return items

    coerced = _coerce_text(value)
    return [coerced] if coerced else []


class SectionType(str, Enum):
    """Types of resume sections."""

    PERSONAL_INFO = "personalInfo"
    TEXT = "text"
    ITEM_LIST = "itemList"
    STRING_LIST = "stringList"


class PersonalInfo(BaseModel):
    """Personal information section."""

    name: str = ""
    title: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    website: str | None = None
    linkedin: str | None = None
    github: str | None = None


class Experience(BaseModel):
    """Work experience entry."""

    id: int = 0
    title: str = ""
    company: str = ""
    location: str | None = None
    years: str = ""
    description: list[str] = Field(default_factory=list)

    @field_validator("description", mode="before")
    @classmethod
    def _normalize_description(cls, value: Any) -> list[str]:
        return _coerce_string_list(value)


class Education(BaseModel):
    """Education entry."""

    id: int = 0
    institution: str = ""
    degree: str = ""
    years: str = ""
    description: str | None = None

    @field_validator("description", mode="before")
    @classmethod
    def _normalize_description(cls, value: Any) -> str | None:
        return _coerce_optional_text(value)


class Project(BaseModel):
    """Personal project entry."""

    id: int = 0
    name: str = ""
    role: str = ""
    years: str = ""
    github: str | None = None
    website: str | None = None
    description: list[str] = Field(default_factory=list)

    @field_validator("description", mode="before")
    @classmethod
    def _normalize_description(cls, value: Any) -> list[str]:
        return _coerce_string_list(value)


class AdditionalInfo(BaseModel):
    """Additional information section."""

    technicalSkills: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    certificationsTraining: list[str] = Field(default_factory=list)
    awards: list[str] = Field(default_factory=list)

    @field_validator(
        "technicalSkills",
        "languages",
        "certificationsTraining",
        "awards",
        mode="before",
    )
    @classmethod
    def _normalize_string_fields(cls, value: Any) -> list[str]:
        return _coerce_string_list(value)


class SectionMeta(BaseModel):
    """Metadata for a resume section."""

    id: str
    key: str
    displayName: str
    sectionType: SectionType
    isDefault: bool = True
    isVisible: bool = True
    order: int = 0


class CustomSectionItem(BaseModel):
    """Generic item for custom item-based sections."""

    id: int = 0
    title: str = ""
    subtitle: str | None = None
    location: str | None = None
    years: str = ""
    description: list[str] = Field(default_factory=list)

    @field_validator("description", mode="before")
    @classmethod
    def _normalize_description(cls, value: Any) -> list[str]:
        return _coerce_string_list(value)


class CustomSection(BaseModel):
    """Custom section data container."""

    sectionType: SectionType
    items: list[CustomSectionItem] | None = None
    strings: list[str] | None = None
    text: str | None = None

    @field_validator("strings", mode="before")
    @classmethod
    def _normalize_strings(cls, value: Any) -> list[str] | None:
        if value is None:
            return None
        return _coerce_string_list(value)

    @field_validator("text", mode="before")
    @classmethod
    def _normalize_text(cls, value: Any) -> str | None:
        return _coerce_optional_text(value)


DEFAULT_SECTION_META: list[dict[str, Any]] = [
    {
        "id": "personalInfo",
        "key": "personalInfo",
        "displayName": "Personal Info",
        "sectionType": SectionType.PERSONAL_INFO,
        "isDefault": True,
        "isVisible": True,
        "order": 0,
    },
    {
        "id": "summary",
        "key": "summary",
        "displayName": "Summary",
        "sectionType": SectionType.TEXT,
        "isDefault": True,
        "isVisible": True,
        "order": 1,
    },
    {
        "id": "workExperience",
        "key": "workExperience",
        "displayName": "Experience",
        "sectionType": SectionType.ITEM_LIST,
        "isDefault": True,
        "isVisible": True,
        "order": 2,
    },
    {
        "id": "education",
        "key": "education",
        "displayName": "Education",
        "sectionType": SectionType.ITEM_LIST,
        "isDefault": True,
        "isVisible": True,
        "order": 3,
    },
    {
        "id": "personalProjects",
        "key": "personalProjects",
        "displayName": "Projects",
        "sectionType": SectionType.ITEM_LIST,
        "isDefault": True,
        "isVisible": True,
        "order": 4,
    },
    {
        "id": "additional",
        "key": "additional",
        "displayName": "Skills & Awards",
        "sectionType": SectionType.STRING_LIST,
        "isDefault": True,
        "isVisible": True,
        "order": 5,
    },
]


def normalize_resume_data(data: dict[str, Any]) -> dict[str, Any]:
    if not data.get("sectionMeta"):
        data["sectionMeta"] = copy.deepcopy(DEFAULT_SECTION_META)
    if "customSections" not in data:
        data["customSections"] = {}
    return data


class ResumeData(BaseModel):
    """Complete structured resume data."""

    personalInfo: PersonalInfo = Field(default_factory=PersonalInfo)
    summary: str = ""
    workExperience: list[Experience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    personalProjects: list[Project] = Field(default_factory=list)
    additional: AdditionalInfo = Field(default_factory=AdditionalInfo)

    sectionMeta: list[SectionMeta] = Field(default_factory=list)
    customSections: dict[str, CustomSection] = Field(default_factory=dict)

    @field_validator("summary", mode="before")
    @classmethod
    def _normalize_summary(cls, value: Any) -> str:
        return _coerce_text(value)
