"""Prompt template for code review and evaluation."""

from langchain_core.prompts import ChatPromptTemplate

CODE_REVIEW_SYSTEM = """You are an expert code reviewer and technical interviewer. 
Your role is to evaluate code submissions from interview candidates, assessing 
correctness, code quality, efficiency, and problem-solving approach.

Evaluation Criteria:
- Correctness: Does the code solve the problem correctly?
- Code Quality: Is the code readable, well-structured, and maintainable?
- Efficiency: Is the solution efficient in terms of time and space complexity?
- Edge Cases: Does the code handle edge cases appropriately?
- Best Practices: Does the code follow language-specific best practices?
"""

CODE_REVIEW_TEMPLATE = ChatPromptTemplate.from_messages(
    [
        ("system", CODE_REVIEW_SYSTEM),
        (
            "human",
            """Review the following code submission:

Problem/Question:
{question}

Language: {language}

Code Submitted:
```{language}
{code}
```

Execution Results:
- Success: {execution_success}
- Output: {stdout}
- Errors: {stderr}
- Execution Time: {execution_time}ms

Please evaluate this code and provide your assessment in the following JSON format:
{{
    "score": <1-5>,
    "correctness": {{
        "score": <1-5>,
        "feedback": "Assessment of whether the code solves the problem"
    }},
    "code_quality": {{
        "score": <1-5>,
        "feedback": "Assessment of readability, structure, naming conventions"
    }},
    "efficiency": {{
        "time_complexity": "O(...)",
        "space_complexity": "O(...)",
        "feedback": "Assessment of algorithmic efficiency"
    }},
    "edge_cases": {{
        "handled": ["edge case 1", "edge case 2"],
        "missed": ["edge case 3"],
        "feedback": "Assessment of edge case handling"
    }},
    "strengths": ["Code strength 1", "Code strength 2"],
    "improvements": ["Suggested improvement 1", "Suggested improvement 2"],
    "alternative_approach": "Optional description of a better or alternative approach"
}}
""",
        ),
    ]
)


STREAMING_CODE_REVIEW_TEMPLATE = """Review this code submission:

Problem: {question}
Language: {language}

Code:
```{language}
{code}
```

Execution:
- Success: {execution_success}
- Output: {stdout}
- Errors: {stderr}
- Time: {execution_time}ms

Provide your code review:

**Score: X/5**

**Correctness**
[Does the code solve the problem? Are there any bugs?]

**Code Quality**
[Assessment of readability, naming, structure]

**Efficiency**
- Time Complexity: O(...)
- Space Complexity: O(...)
[Is this optimal? Could it be improved?]

**Edge Cases**
- Handled: [List edge cases properly handled]
- Missed: [List edge cases not handled]

**Strengths**
- [What the candidate did well]

**Areas for Improvement**
- [Specific suggestions for improvement]

**Alternative Approach**
[If applicable, describe a better solution approach]
"""


def get_code_review_prompt() -> ChatPromptTemplate:
    """Get the prompt template for code review."""
    return CODE_REVIEW_TEMPLATE


def get_streaming_code_review_prompt() -> str:
    """Get the streaming code review prompt template string."""
    return STREAMING_CODE_REVIEW_TEMPLATE
