"""Answer evaluator service with streaming support."""

import json
import re
from typing import Any, AsyncGenerator, Dict, List, Optional

from app.core.llm import get_llm
from app.data.prompt.interview_evaluator import (
    get_evaluation_prompt,
    get_streaming_evaluation_prompt,
)
from app.data.prompt.code_review import get_streaming_code_review_prompt
from app.models.interview.schemas import (
    CodeExecutionResult,
    EvaluationResult,
    InterviewQuestion,
)


class AnswerEvaluator:
    """Evaluates interview answers with streaming support for SSE."""

    def __init__(self):
        self.llm = get_llm()
        self.prompt = get_evaluation_prompt()
        self.streaming_prompt = get_streaming_evaluation_prompt()
        self.code_review_prompt = get_streaming_code_review_prompt()

    async def evaluate(
        self,
        question: InterviewQuestion,
        answer: str,
        role: str,
    ) -> EvaluationResult:
        """Evaluate an answer and return structured result."""
        if not self.llm:
            return EvaluationResult(
                score=3,
                feedback="Evaluation service unavailable",
                strengths=[],
                improvements=[],
            )

        chain = self.prompt | self.llm

        try:
            response = await chain.ainvoke(
                {
                    "role": role,
                    "difficulty": question.difficulty.value,
                    "topic": question.topic or "General",
                    "question": question.question,
                    "expected_keywords": ", ".join(question.expected_keywords)
                    if question.expected_keywords
                    else "N/A",
                    "answer": answer,
                }
            )

            content = (
                response.content if hasattr(response, "content") else str(response)
            )
            parsed = self._parse_evaluation_response(content)

            return EvaluationResult(
                score=parsed.get("score", 3),
                feedback=parsed.get("feedback", "Answer evaluated"),
                strengths=parsed.get("strengths", []),
                improvements=parsed.get("improvements", []),
            )
        except Exception as e:
            return EvaluationResult(
                score=3,
                feedback=f"Evaluation error: {str(e)}",
                strengths=[],
                improvements=[],
            )

    async def evaluate_streaming(
        self,
        question: InterviewQuestion,
        answer: str,
        role: str,
    ) -> AsyncGenerator[str, None]:
        """Stream evaluation response token by token for SSE."""
        if not self.llm:
            yield "Evaluation service is unavailable."
            return

        prompt_text = self.streaming_prompt.format(
            role=role,
            difficulty=question.difficulty.value,
            question=question.question,
            answer=answer,
            expected_keywords=", ".join(question.expected_keywords)
            if question.expected_keywords
            else "N/A",
        )

        try:
            async for chunk in self.llm.astream(prompt_text):
                if hasattr(chunk, "content") and chunk.content:
                    yield chunk.content
                elif isinstance(chunk, str):
                    yield chunk
        except Exception as e:
            yield f"\n\nError during evaluation: {str(e)}"

    async def evaluate_code_streaming(
        self,
        question: InterviewQuestion,
        code: str,
        language: str,
        execution_result: CodeExecutionResult,
    ) -> AsyncGenerator[str, None]:
        """Stream code evaluation for SSE."""
        if not self.llm:
            yield "Code review service is unavailable."
            return

        prompt_text = self.code_review_prompt.format(
            question=question.question,
            language=language,
            code=code,
            execution_success=execution_result.success,
            stdout=execution_result.stdout[:1000]
            if execution_result.stdout
            else "No output",
            stderr=execution_result.stderr[:500]
            if execution_result.stderr
            else "No errors",
            execution_time=execution_result.execution_time_ms,
        )

        try:
            async for chunk in self.llm.astream(prompt_text):
                if hasattr(chunk, "content") and chunk.content:
                    yield chunk.content
                elif isinstance(chunk, str):
                    yield chunk
        except Exception as e:
            yield f"\n\nError during code review: {str(e)}"

    def _parse_evaluation_response(self, content: str) -> Dict[str, Any]:
        """Parse the LLM evaluation response."""
        try:
            # Try to find JSON in the response
            start = content.find("{")
            end = content.rfind("}") + 1
            if start != -1 and end > start:
                json_str = content[start:end]
                return json.loads(json_str)
        except json.JSONDecodeError:
            pass

        # Try to extract score from markdown format
        result: Dict[str, Any] = {
            "score": 3,
            "feedback": content,
            "strengths": [],
            "improvements": [],
        }

        # Look for "Score: X/5" pattern
        score_match = re.search(r"\*\*Score:\s*(\d)/5\*\*", content)
        if score_match:
            result["score"] = int(score_match.group(1))

        # Extract strengths
        strengths_match = re.search(r"\*\*Strengths:\*\*\n((?:- .+\n?)+)", content)
        if strengths_match:
            strengths = re.findall(r"- (.+)", strengths_match.group(1))
            result["strengths"] = strengths

        # Extract improvements
        improvements_match = re.search(
            r"\*\*Areas for Improvement:\*\*\n((?:- .+\n?)+)", content
        )
        if improvements_match:
            improvements = re.findall(r"- (.+)", improvements_match.group(1))
            result["improvements"] = improvements

        return result

    def parse_score_from_streaming(self, full_response: str) -> int:
        """Extract the score from a streamed evaluation response."""
        # Look for "Score: X/5" pattern
        score_match = re.search(r"\*\*Score:\s*(\d)/5\*\*", full_response)
        if score_match:
            return int(score_match.group(1))

        # Look for just "X/5" pattern
        score_match = re.search(r"(\d)/5", full_response)
        if score_match:
            return int(score_match.group(1))

        return 3  # Default middle score

    def parse_full_streaming_response(self, full_response: str) -> Dict[str, Any]:
        """Parse a complete streamed response into structured data."""
        result = {
            "score": self.parse_score_from_streaming(full_response),
            "feedback": full_response,
            "strengths": [],
            "improvements": [],
        }

        # Extract strengths section
        strengths_match = re.search(
            r"\*\*Strengths:\*\*\n((?:- .+\n?)+)", full_response, re.MULTILINE
        )
        if strengths_match:
            result["strengths"] = re.findall(r"- (.+)", strengths_match.group(1))

        # Extract improvements section
        improvements_match = re.search(
            r"\*\*Areas for Improvement:\*\*\n((?:- .+\n?)+)",
            full_response,
            re.MULTILINE,
        )
        if improvements_match:
            result["improvements"] = re.findall(r"- (.+)", improvements_match.group(1))

        return result
