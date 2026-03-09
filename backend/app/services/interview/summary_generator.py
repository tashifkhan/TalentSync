"""Summary generator service for completed interviews."""

import json
import re
from typing import Any, AsyncGenerator, Dict, List, Optional

from langchain_core.language_models import BaseChatModel

from app.core.llm import get_llm
from app.data.prompt.interview_summary import (
    get_streaming_summary_prompt,
    get_summary_prompt,
)
from app.models.interview.schemas import InterviewSession


class SummaryGenerator:
    """Generates comprehensive interview summaries."""

    def __init__(self, llm: Optional[BaseChatModel] = None):
        self.llm = llm or get_llm()
        self.prompt = get_summary_prompt()
        self.streaming_prompt = get_streaming_summary_prompt()

    async def generate_summary(
        self,
        session: InterviewSession,
    ) -> Dict[str, Any]:
        """Generate a structured interview summary."""
        if not self.llm:
            return {
                "summary": "Summary generation unavailable",
                "strengths": [],
                "weaknesses": [],
                "recommendations": [],
                "hiring_recommendation": "maybe",
            }

        # Prepare questions summary
        questions_summary = self._format_questions_summary(session)

        # Calculate final score
        final_score = self._calculate_final_score(session)

        chain = self.prompt | self.llm

        try:
            response = await chain.ainvoke(
                {
                    "role": session.config.role,
                    "total_questions": len(session.questions),
                    "final_score": final_score,
                    "questions_summary": questions_summary,
                    "tab_switch_count": session.tab_switch_count,
                    "other_events": self._format_events(session),
                }
            )

            content = (
                response.content if hasattr(response, "content") else str(response)
            )
            return self._parse_summary_response(content, final_score)
        except Exception as e:
            return {
                "summary": f"Error generating summary: {str(e)}",
                "strengths": [],
                "weaknesses": [],
                "recommendations": [],
                "hiring_recommendation": "maybe",
                "final_score": final_score,
            }

    async def generate_summary_streaming(
        self,
        session: InterviewSession,
    ) -> AsyncGenerator[str, None]:
        """Stream summary generation for SSE."""
        if not self.llm:
            yield "Summary generation service is unavailable."
            return

        # Prepare questions summary
        questions_summary = self._format_questions_summary(session)
        final_score = self._calculate_final_score(session)

        prompt_text = self.streaming_prompt.format(
            role=session.config.role,
            final_score=final_score,
            total_questions=len(session.questions),
            questions_summary=questions_summary,
            tab_switch_count=session.tab_switch_count,
        )

        try:
            async for chunk in self.llm.astream(prompt_text):
                if hasattr(chunk, "content") and chunk.content:
                    yield chunk.content
                elif isinstance(chunk, str):
                    yield chunk
        except Exception as e:
            yield f"\n\nError during summary generation: {str(e)}"

    def _format_questions_summary(self, session: InterviewSession) -> str:
        """Format questions and answers for the summary prompt."""
        lines = []
        for i, q in enumerate(session.questions, 1):
            lines.append(f"\nQuestion {i}: {q.question}")
            lines.append(f"Difficulty: {q.difficulty.value}")
            lines.append(f"Topic: {q.topic or 'General'}")
            lines.append(f"Answer: {q.answer or 'No answer provided'}")
            lines.append(f"Score: {q.score or 0}/5")
            if q.feedback:
                lines.append(f"Feedback: {q.feedback[:200]}...")
            lines.append("---")
        return "\n".join(lines)

    def _format_events(self, session: InterviewSession) -> str:
        """Format session events for context."""
        if not session.events:
            return "No notable events"

        event_counts: Dict[str, int] = {}
        for event in session.events:
            event_type = event.get("event_type", "unknown")
            event_counts[event_type] = event_counts.get(event_type, 0) + 1

        return ", ".join(f"{k}: {v}" for k, v in event_counts.items())

    def _calculate_final_score(self, session: InterviewSession) -> int:
        """Calculate the final interview score as a percentage."""
        if not session.questions:
            return 0

        total_score = sum(q.score or 0 for q in session.questions)
        max_score = len(session.questions) * 5

        if max_score == 0:
            return 0

        return round((total_score / max_score) * 100)

    def _parse_summary_response(self, content: str, final_score: int) -> Dict[str, Any]:
        """Parse the LLM summary response."""
        result: Dict[str, Any] = {
            "summary": "",
            "strengths": [],
            "weaknesses": [],
            "recommendations": [],
            "hiring_recommendation": "maybe",
            "final_score": final_score,
        }

        # Try JSON parsing first
        try:
            start = content.find("{")
            end = content.rfind("}") + 1
            if start != -1 and end > start:
                json_str = content[start:end]
                parsed = json.loads(json_str)
                result.update(parsed)
                result["final_score"] = final_score
                return result
        except json.JSONDecodeError:
            pass

        # Parse markdown format
        result["summary"] = content

        # Extract hiring recommendation
        rec_match = re.search(
            r"\*\*Recommendation:\s*(STRONG YES|YES|MAYBE|NO|STRONG NO)\*\*",
            content,
            re.IGNORECASE,
        )
        if rec_match:
            rec = rec_match.group(1).lower().replace(" ", "_")
            result["hiring_recommendation"] = rec

        # Extract strengths
        strengths_match = re.search(
            r"## Key Strengths\n\n((?:- .+\n?)+)", content, re.MULTILINE
        )
        if strengths_match:
            result["strengths"] = re.findall(r"- (.+)", strengths_match.group(1))

        # Extract weaknesses/improvements
        weaknesses_match = re.search(
            r"## Areas for Improvement\n\n((?:- .+\n?)+)", content, re.MULTILINE
        )
        if weaknesses_match:
            result["weaknesses"] = re.findall(r"- (.+)", weaknesses_match.group(1))

        return result

    def parse_streaming_summary(self, full_response: str) -> Dict[str, Any]:
        """Parse a complete streamed summary into structured data."""
        return self._parse_summary_response(full_response, 0)
