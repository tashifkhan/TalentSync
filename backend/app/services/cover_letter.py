"""Cover letter, outreach message, and resume title generation service."""

import json
from typing import Any, Optional

from langchain_core.language_models import BaseChatModel

from app.agents.web_content_agent import return_markdown
from app.services.language import get_language_name


def _resolve_job_description(job_description: str, jd_url: Optional[str]) -> str:
    """Resolve the final job description text from either a URL or pasted text.

    If a URL is provided, fetch its content via Jina AI.  The fetched content
    takes precedence; any manually-entered text is appended afterwards so that
    supplementary notes are preserved.
    """
    fetched = ""
    if jd_url and jd_url.strip():
        url = jd_url.strip()
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
        fetched = return_markdown(url)

    if fetched and job_description.strip():
        return f"{fetched}\n\n---\nAdditional context:\n{job_description.strip()}"
    if fetched:
        return fetched
    return job_description


COVER_LETTER_PROMPT = """Write a brief cover letter for this job application.

IMPORTANT: Write in {output_language}.

Job Description:
{job_description}

Candidate Resume (JSON):
{resume_data}

Recipient: {recipient_name} at {company_name}
Sender: {sender_name}
Sender Goal/Role: {sender_role_or_goal}
Key Points to Highlight: {key_points_to_include}
Additional Context: {additional_info}

Requirements:
- 150-250 words maximum
- 3-4 short paragraphs
- Opening: Reference ONE specific thing from the job description (product, tech stack, or problem they're solving) - not generic excitement about "the role"
- Middle: Pick 1-2 qualifications from resume that DIRECTLY match stated requirements - prioritize relevance over impressiveness
- Closing: Simple availability to discuss, no desperate enthusiasm
- If resume shows career transition, frame the pivot as intentional and relevant
- Use the company name from the provided details - do not use placeholders
- Address to the recipient by name if provided
- Do NOT invent information not in the resume
- Tone: Confident peer, not eager applicant
- Do NOT use em dash characters or double/triple hyphen in the output

Output plain text only. No JSON, no markdown formatting."""


COVER_LETTER_EDIT_PROMPT = """Edit the following cover letter based on the user's instructions.

IMPORTANT: Write in {output_language}.

Previous Cover Letter:
{previous_cover_letter}

Edit Instructions (FOLLOW THESE STRICTLY):
{edit_instructions}

Job Description:
{job_description}

Candidate Resume (JSON):
{resume_data}

Recipient: {recipient_name} at {company_name}
Sender: {sender_name}
Sender Goal/Role: {sender_role_or_goal}
Key Points to Highlight: {key_points_to_include}
Additional Context: {additional_info}

Requirements:
- Use the previous cover letter as a base
- Follow the user's edit instructions VERY STRICTLY
- Keep it 150-250 words maximum
- 3-4 short paragraphs
- Maintain a confident, professional tone
- Do NOT invent information not in the resume
- Do NOT use em dash characters or double/triple hyphen in the output

Output plain text only. No JSON, no markdown formatting."""


OUTREACH_MESSAGE_PROMPT = """Generate a cold outreach message for LinkedIn or email about this job opportunity.

IMPORTANT: Write in {output_language}.

Job Description:
{job_description}

Candidate Resume (JSON):
{resume_data}

Guidelines:
- 70-100 words maximum (shorter than a cover letter)
- First sentence: Reference specific detail from job description (team, product, technical challenge) - never open with "I'm reaching out" or "I saw your posting"
- One sentence on strongest matching qualification with a concrete metric if available
- End with low-friction ask: "Worth a quick chat?" not "I'd love the opportunity to discuss"
- Tone: How you'd message a former colleague, not a stranger
- Do NOT include placeholder brackets
- Do NOT use phrases like "excited about" or "passionate about"
- Do NOT use em dash characters or double/triple hyphen in the output

Output plain text only. No JSON, no markdown formatting."""

GENERATE_TITLE_PROMPT = """Extract the job title and company name from this job description.

IMPORTANT: Write in {output_language}.

Job Description:
{job_description}

Rules:
- Format: "Role @ Company" (e.g., "Senior Frontend Engineer @ Stripe")
- If the company name is not found, return just the role (e.g., "Senior Frontend Engineer")
- Maximum 60 characters
- Use the most specific role title mentioned
- Do not add any other text, quotes, or formatting

Output the title only, nothing else."""


async def generate_cover_letter(
    resume_data: dict[str, Any],
    job_description: str,
    llm: BaseChatModel,
    recipient_name: str = "",
    company_name: str = "",
    sender_name: str = "",
    sender_role_or_goal: str = "",
    key_points_to_include: str = "",
    additional_info: str = "",
    language: str = "en",
    jd_url: Optional[str] = None,
) -> str:
    output_language = get_language_name(language)
    resolved_jd = _resolve_job_description(job_description, jd_url)

    prompt = COVER_LETTER_PROMPT.format(
        job_description=resolved_jd,
        resume_data=json.dumps(resume_data, indent=2, ensure_ascii=True),
        output_language=output_language,
        recipient_name=recipient_name or "Hiring Manager",
        company_name=company_name or "the company",
        sender_name=sender_name or "the candidate",
        sender_role_or_goal=sender_role_or_goal or "Not specified",
        key_points_to_include=key_points_to_include or "Not specified",
        additional_info=additional_info or "None",
    )

    result = await llm.ainvoke(
        f"You are a professional career coach and resume writer. "
        f"Write compelling, personalized cover letters.\n\n{prompt}"
    )

    return str(getattr(result, "content", result)).strip()


async def edit_cover_letter(
    resume_data: dict[str, Any],
    job_description: str,
    previous_cover_letter: str,
    edit_instructions: str,
    llm: BaseChatModel,
    recipient_name: str = "",
    company_name: str = "",
    sender_name: str = "",
    sender_role_or_goal: str = "",
    key_points_to_include: str = "",
    additional_info: str = "",
    language: str = "en",
    jd_url: Optional[str] = None,
) -> str:
    output_language = get_language_name(language)
    resolved_jd = _resolve_job_description(job_description, jd_url)

    prompt = COVER_LETTER_EDIT_PROMPT.format(
        previous_cover_letter=previous_cover_letter,
        edit_instructions=edit_instructions,
        job_description=resolved_jd,
        resume_data=json.dumps(resume_data, indent=2, ensure_ascii=True),
        output_language=output_language,
        recipient_name=recipient_name or "Hiring Manager",
        company_name=company_name or "the company",
        sender_name=sender_name or "the candidate",
        sender_role_or_goal=sender_role_or_goal or "Not specified",
        key_points_to_include=key_points_to_include or "Not specified",
        additional_info=additional_info or "None",
    )

    result = await llm.ainvoke(
        f"You are a professional career coach and resume writer. "
        f"Edit cover letters based on user instructions while maintaining quality.\n\n{prompt}"
    )

    return str(getattr(result, "content", result)).strip()


async def generate_outreach_message(
    resume_data: dict[str, Any],
    job_description: str,
    llm: BaseChatModel,
    language: str = "en",
) -> str:
    output_language = get_language_name(language)

    prompt = OUTREACH_MESSAGE_PROMPT.format(
        job_description=job_description,
        resume_data=json.dumps(resume_data, indent=2, ensure_ascii=True),
        output_language=output_language,
    )

    result = await llm.ainvoke(
        f"You are a professional networking coach. "
        f"Write genuine, engaging cold outreach messages.\n\n{prompt}"
    )

    return str(getattr(result, "content", result)).strip()


async def generate_resume_title(
    job_description: str,
    llm: BaseChatModel,
    language: str = "en",
) -> str:
    output_language = get_language_name(language)

    prompt = GENERATE_TITLE_PROMPT.format(
        job_description=job_description,
        output_language=output_language,
    )

    result = await llm.ainvoke(
        f"You extract job titles and company names from job descriptions.\n\n{prompt}"
    )

    title = str(getattr(result, "content", result)).strip().strip("\"'")
    return title[:80]
