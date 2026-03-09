"""Prompt template for generating interview questions."""

from langchain_core.prompts import ChatPromptTemplate

INTERVIEW_QUESTION_SYSTEM = """You are an expert technical interviewer with years of experience 
conducting interviews for top technology companies. Your role is to generate thoughtful, 
relevant interview questions that assess candidates effectively.

Guidelines:
- Questions should be clear and unambiguous
- Avoid questions that can be answered with a simple yes/no
- Tailor questions to the specified difficulty level
- For technical roles, include questions that test both theoretical knowledge and practical application
- For behavioral questions, use the STAR method format (Situation, Task, Action, Result)
- Avoid questions that have already been asked in this interview
"""

INTERVIEW_QUESTION_TEMPLATE = ChatPromptTemplate.from_messages(
    [
        ("system", INTERVIEW_QUESTION_SYSTEM),
        (
            "human",
            """Generate an interview question for the following context:

Role: {role}
Difficulty: {difficulty}
Topic/Focus Area: {topic}
Question Type: {question_type}

Candidate Background:
{candidate_background}

Questions already asked in this interview (avoid repeating):
{existing_questions}

{additional_context}

Generate a single interview question that:
1. Is appropriate for the {difficulty} difficulty level
2. Tests relevant skills for the {role} position
3. Focuses on the {topic} area
4. Is different from the questions already asked

Return your response in the following JSON format:
{{
    "question": "The interview question text",
    "expected_keywords": ["keyword1", "keyword2", "keyword3"],
    "follow_up_questions": ["Optional follow-up 1", "Optional follow-up 2"],
    "evaluation_criteria": "Brief description of what makes a good answer"
}}
""",
        ),
    ]
)


def get_question_generation_prompt() -> ChatPromptTemplate:
    """Get the prompt template for question generation."""
    return INTERVIEW_QUESTION_TEMPLATE
