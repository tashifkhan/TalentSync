"""Prompt template for generating interview summaries."""

from langchain_core.prompts import ChatPromptTemplate

INTERVIEW_SUMMARY_SYSTEM = """You are an expert interview analyst tasked with providing 
comprehensive summaries of interview sessions. Your summaries help hiring managers 
make informed decisions while providing constructive feedback for candidates.

Summary Guidelines:
- Be objective and evidence-based
- Reference specific answers and scores when making assessments
- Provide clear hiring recommendations with justification
- Balance strengths and areas for improvement
- Consider the overall pattern of responses, not just individual answers
"""

INTERVIEW_SUMMARY_TEMPLATE = ChatPromptTemplate.from_messages(
    [
        ("system", INTERVIEW_SUMMARY_SYSTEM),
        (
            "human",
            """Generate a comprehensive summary for the following interview:

Role: {role}
Total Questions: {total_questions}
Final Score: {final_score}%

Questions and Evaluations:
{questions_summary}

Interview Events:
- Tab Switches: {tab_switch_count}
- Other Events: {other_events}

Please provide a comprehensive interview summary in the following JSON format:
{{
    "summary": "2-3 paragraph overall assessment of the candidate",
    "strengths": ["Key strength 1", "Key strength 2", "Key strength 3"],
    "weaknesses": ["Area of concern 1", "Area of concern 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "hiring_recommendation": "strong_yes|yes|maybe|no|strong_no",
    "hiring_justification": "Brief justification for the hiring recommendation",
    "topics_to_probe": ["Topic that needs further exploration in next round"],
    "cultural_fit_notes": "Observations about potential cultural fit based on behavioral answers",
    "technical_proficiency": "low|medium|high|expert",
    "communication_skills": "poor|fair|good|excellent"
}}
""",
        ),
    ]
)


STREAMING_SUMMARY_TEMPLATE = """Generate a comprehensive interview summary:

Role: {role}
Final Score: {final_score}%
Questions Answered: {total_questions}

Performance Breakdown:
{questions_summary}

Interview Integrity:
- Tab Switches: {tab_switch_count}

Provide your summary in this format:

## Overall Assessment

[2-3 paragraph comprehensive assessment of the candidate's performance]

## Key Strengths

- [Strength 1 with specific example from interview]
- [Strength 2 with specific example]
- [Strength 3 with specific example]

## Areas for Improvement

- [Area 1 with constructive feedback]
- [Area 2 with constructive feedback]

## Technical Proficiency

[Assessment of technical skills demonstrated: Low/Medium/High/Expert]

## Communication Skills

[Assessment of how well the candidate articulated their thoughts: Poor/Fair/Good/Excellent]

## Hiring Recommendation

**Recommendation: [STRONG YES / YES / MAYBE / NO / STRONG NO]**

[Justification for the recommendation based on the interview performance]

## Next Steps

[Suggested follow-up actions or topics to explore in subsequent interviews]
"""


def get_summary_prompt() -> ChatPromptTemplate:
    """Get the prompt template for interview summary generation."""
    return INTERVIEW_SUMMARY_TEMPLATE


def get_streaming_summary_prompt() -> str:
    """Get the streaming summary prompt template string."""
    return STREAMING_SUMMARY_TEMPLATE
