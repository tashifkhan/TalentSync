"""Prompt templates for resume improvement and keyword extraction."""

from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import PromptTemplate

RESUME_SCHEMA_EXAMPLE = """{
  "skills_analysis": [
    { "skill_name": "Python", "percentage": 90 },
    { "skill_name": "React", "percentage": 85 }
  ],
  "recommended_roles": ["Backend Engineer", "Full Stack Developer"],
  "languages": [{ "language": "English (Native)" }],
  "education": [
    { "education_detail": "B.S. Computer Science - University of California (2014 - 2018)" }
  ],
  "work_experience": [
    {
      "role": "Senior Software Engineer",
      "company_and_duration": "Tech Corp | 2020 - Present",
      "bullet_points": [
        "Led development of microservices architecture",
        "Improved system performance by 40%"
      ]
    }
  ],
  "projects": [
    {
      "title": "Open Source Tool",
      "technologies_used": ["Go", "CLI"],
      "live_link": null,
      "repo_link": "https://github.com/example/tool",
      "description": "Built CLI tool with 1000+ GitHub stars"
    }
  ],
  "publications": [],
  "positions_of_responsibility": [],
  "certifications": [
    { "name": "AWS Solutions Architect", "issuing_organization": "AWS" }
  ],
  "achievements": [
    { "title": "Employee of the Year 2022" }
  ],
  "name": "John Doe",
  "email": "john@example.com",
  "contact": "+1-555-0100",
  "linkedin": "linkedin.com/in/johndoe",
  "github": "github.com/johndoe",
  "blog": null,
  "portfolio": "https://johndoe.dev",
  "predicted_field": "Software Engineer"
}"""

RESUME_SCHEMA = RESUME_SCHEMA_EXAMPLE

EXTRACT_KEYWORDS_PROMPT = """Extract job requirements as JSON. Output ONLY the JSON object, no other text.

Example format:
{
  "required_skills": ["Python", "AWS"],
  "preferred_skills": ["Kubernetes"],
  "experience_requirements": ["5+ years"],
  "education_requirements": ["Bachelor's in CS"],
  "key_responsibilities": ["Lead team"],
  "keywords": ["microservices", "agile"],
  "experience_years": 5,
  "seniority_level": "senior"
}

Extract numeric years (e.g., "5+ years" -> 5) and infer seniority level.

Job description:
{job_description}"""

CRITICAL_TRUTHFULNESS_RULES_TEMPLATE = """CRITICAL TRUTHFULNESS RULES - NEVER VIOLATE:
1. DO NOT add any skill, tool, technology, or certification that is not explicitly mentioned in the original resume
2. DO NOT invent numeric achievements (e.g., "increased by 30%") unless they exist in original
3. DO NOT add company names, product names, or technical terms not in the original
4. DO NOT upgrade experience level (e.g., "Junior" -> "Senior")
5. DO NOT add languages, frameworks, or platforms the candidate hasn't used
6. DO NOT extend employment dates or change timelines (start/end years)
7. {rule_7}
8. Preserve factual accuracy - only use information provided by the candidate

Violation of these rules could cause serious problems for the candidate in job interviews.
"""


def _build_truthfulness_rules(rule_7: str) -> str:
    return CRITICAL_TRUTHFULNESS_RULES_TEMPLATE.format(rule_7=rule_7)


CRITICAL_TRUTHFULNESS_RULES = {
    "nudge": _build_truthfulness_rules(
        "DO NOT add new bullet points or content - only rephrase existing content"
    ),
    "keywords": _build_truthfulness_rules(
        "You may rephrase existing bullet points to include keywords, but do NOT add new bullet points"
    ),
    "full": _build_truthfulness_rules(
        "You may expand existing bullet points or add new ones that elaborate on existing work, but DO NOT invent entirely new responsibilities"
    ),
}

IMPROVE_RESUME_PROMPT_NUDGE = """Lightly nudge this resume toward the job description. Output ONLY the JSON object, no other text.

{critical_truthfulness_rules}

IMPORTANT: Generate ALL text content (summary, descriptions, skills) in {output_language}.

Rules:
- Make minimal, conservative edits only where there is a clear existing match
- Do NOT change the candidate's role, industry, or seniority level
- Do NOT introduce new tools, technologies, or certifications not already present
- Do NOT add new bullet points or sections
- Preserve original bullet count and ordering within each section
- Keep proper nouns (names, company names, locations) unchanged
- Preserve the structure of all fields in the original resume
- Preserve original date ranges exactly - do not modify years
- If the resume is non-technical, do NOT add technical jargon
- Do NOT use em dash characters or double/triple hyphen in the output

Job Description:
{job_description}

Keywords to emphasize (only if already supported by resume content):
{job_keywords}

Original Resume:
{original_resume}

Output in this JSON format:
{schema}"""

IMPROVE_RESUME_PROMPT_KEYWORDS = """Enhance this resume with relevant keywords from the job description. Output ONLY the JSON object, no other text.

{critical_truthfulness_rules}

IMPORTANT: Generate ALL text content (summary, descriptions, skills) in {output_language}.

Rules:
- Strengthen alignment by weaving in relevant keywords where evidence already exists
- You may rephrase bullet points to include keyword phrasing
- Do NOT introduce new skills, tools, or certifications not in the resume
- Do NOT change role, industry, or seniority level
- Preserve the structure of all fields in the original resume
- Preserve original date ranges exactly - do not modify years
- If resume is non-technical, keep language non-technical while still aligning keywords
- Do NOT use em dash characters or double/triple hyphen in the output

Job Description:
{job_description}

Keywords to emphasize:
{job_keywords}

Original Resume:
{original_resume}

Output in this JSON format:
{schema}"""

IMPROVE_RESUME_PROMPT_FULL = """Tailor this resume for the job. Output ONLY the JSON object, no other text.

{critical_truthfulness_rules}

IMPORTANT: Generate ALL text content (summary, descriptions, skills) in {output_language}.

Rules:
- Rephrase content to highlight relevant experience
- DO NOT invent new information
- Use action verbs and quantifiable achievements
- Keep proper nouns (names, company names, locations) unchanged
- Translate job titles, descriptions, and skills to {output_language}
- Preserve the structure of all fields in the original resume
- Preserve original date ranges exactly - do not modify years
- Calculate and emphasize total relevant experience duration when it matches requirements
- Do NOT use em dash characters or double/triple hyphen in the output

Job Description:
{job_description}

Keywords to emphasize:
{job_keywords}

Original Resume:
{original_resume}

Output in this JSON format:
{schema}"""

IMPROVE_PROMPT_OPTIONS = [
    {
        "id": "nudge",
        "label": "Light nudge",
        "description": "Minimal edits to better align existing experience.",
    },
    {
        "id": "keywords",
        "label": "Keyword enhance",
        "description": "Blend in relevant keywords without changing role or scope.",
    },
    {
        "id": "full",
        "label": "Full tailor",
        "description": "Comprehensive tailoring using the job description.",
    },
]

IMPROVE_RESUME_PROMPTS = {
    "nudge": IMPROVE_RESUME_PROMPT_NUDGE,
    "keywords": IMPROVE_RESUME_PROMPT_KEYWORDS,
    "full": IMPROVE_RESUME_PROMPT_FULL,
}

DEFAULT_IMPROVE_PROMPT_ID = "keywords"

extract_keywords_prompt = PromptTemplate(
    input_variables=["job_description"],
    template=EXTRACT_KEYWORDS_PROMPT,
)


def build_extract_keywords_chain(llm: BaseChatModel):
    return extract_keywords_prompt | llm
