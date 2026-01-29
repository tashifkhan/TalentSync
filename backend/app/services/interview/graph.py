"""LangGraph-based interview orchestrator."""

from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List, Optional

from app.models.interview.enums import InterviewStatus
from app.models.interview.schemas import (
    CandidateProfile,
    CodeExecutionResult,
    InterviewConfig,
    InterviewQuestion,
    InterviewSession,
)
from app.services.interview.answer_evaluator import AnswerEvaluator
from app.services.interview.code_executor import CodeExecutor
from app.services.interview.question_generator import QuestionGenerator
from app.services.interview.session_manager import SessionManager, get_session_manager
from app.services.interview.summary_generator import SummaryGenerator


class InterviewGraph:
    """Orchestrates the interview flow using various services.

    This class coordinates:
    - Session management
    - Question generation
    - Answer evaluation (with streaming)
    - Code execution
    - Summary generation
    """

    def __init__(
        self,
        session_manager: Optional[SessionManager] = None,
        question_generator: Optional[QuestionGenerator] = None,
        answer_evaluator: Optional[AnswerEvaluator] = None,
        code_executor: Optional[CodeExecutor] = None,
        summary_generator: Optional[SummaryGenerator] = None,
    ):
        self.session_manager = session_manager or get_session_manager()
        self.question_generator = question_generator or QuestionGenerator()
        self.answer_evaluator = answer_evaluator or AnswerEvaluator()
        self.code_executor = code_executor or CodeExecutor()
        self.summary_generator = summary_generator or SummaryGenerator()

    async def create_session(
        self,
        profile: CandidateProfile,
        config: InterviewConfig,
    ) -> InterviewSession:
        """Create a new interview session and generate questions.

        Args:
            profile: Candidate profile information
            config: Interview configuration

        Returns:
            New InterviewSession with generated questions
        """
        # Create the session
        session = await self.session_manager.create(
            profile=profile,
            config=config,
        )

        # Generate questions
        questions = await self.question_generator.generate_questions(
            role=config.role,
            num_questions=config.num_questions,
            difficulty_distribution=config.difficulty_distribution,
            template_id=config.template_id,
            topic=config.topic,
            resume_data=profile.resume_data,
        )

        session.questions = questions
        session.status = InterviewStatus.IN_PROGRESS
        session.started_at = datetime.utcnow()

        await self.session_manager.save(session)

        return session

    async def get_session(self, session_id: str) -> Optional[InterviewSession]:
        """Get an interview session by ID."""
        return await self.session_manager.get(session_id)

    async def get_current_question(
        self, session: InterviewSession
    ) -> Optional[InterviewQuestion]:
        """Get the current question for a session."""
        if session.current_question_index < len(session.questions):
            return session.questions[session.current_question_index]
        return None

    async def submit_answer(
        self,
        session_id: str,
        question_id: str,
        answer: str,
    ) -> Dict[str, Any]:
        """Submit an answer and get evaluation result.

        Args:
            session_id: The session ID
            question_id: The question ID being answered
            answer: The candidate's answer

        Returns:
            Dict with evaluation result and next question info
        """
        session = await self.session_manager.get(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")

        current_question = await self.get_current_question(session)
        if not current_question:
            raise ValueError("No active question for this session")
        if current_question.id != question_id:
            raise ValueError("Question does not match current interview state")

        # Find the question
        current_question = await self.get_current_question(session)
        if not current_question:
            raise ValueError("No active question for this session")
        if current_question.id != question_id:
            raise ValueError("Question does not match current interview state")

        question = next((q for q in session.questions if q.id == question_id), None)
        if not question:
            raise ValueError(f"Question not found: {question_id}")

        # Evaluate the answer
        evaluation = await self.answer_evaluator.evaluate(
            question=question,
            answer=answer,
            role=session.config.role,
        )

        # Update the question
        question.answer = answer
        question.score = evaluation.score
        question.feedback = evaluation.feedback
        question.strengths = evaluation.strengths
        question.improvements = evaluation.improvements
        question.answered_at = datetime.utcnow()

        # Move to next question
        session.current_question_index += 1

        await self.session_manager.save(session)

        # Get next question or None if complete
        next_question = await self.get_current_question(session)
        is_complete = next_question is None

        if is_complete:
            await self.session_manager.complete_interview(session_id)

        return {
            "evaluation": evaluation,
            "next_question": next_question,
            "is_complete": is_complete,
            "session": session,
        }

    async def submit_answer_streaming(
        self,
        session_id: str,
        question_id: str,
        answer: str,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Submit an answer and stream the evaluation.

        Yields chunks for SSE streaming.
        """
        session = await self.session_manager.get(session_id)
        if not session:
            yield {"type": "error", "message": f"Session not found: {session_id}"}
            return

        current_question = await self.get_current_question(session)
        if not current_question:
            yield {"type": "error", "message": "No active question for this session"}
            return
        if current_question.id != question_id:
            yield {
                "type": "error",
                "message": "Question does not match current interview state",
            }
            return

        # Find the question
        question = next((q for q in session.questions if q.id == question_id), None)
        if not question:
            yield {"type": "error", "message": f"Question not found: {question_id}"}
            return

        # Stream the evaluation
        full_response = ""
        async for chunk in self.answer_evaluator.evaluate_streaming(
            question=question,
            answer=answer,
            role=session.config.role,
        ):
            full_response += chunk
            yield {"type": "chunk", "content": chunk}

        # Parse the final response
        parsed = self.answer_evaluator.parse_full_streaming_response(full_response)

        # Update the question
        question.answer = answer
        question.score = parsed["score"]
        question.feedback = full_response
        question.strengths = parsed["strengths"]
        question.improvements = parsed["improvements"]
        question.answered_at = datetime.utcnow()

        # Move to next question
        session.current_question_index += 1

        await self.session_manager.save(session)

        # Get next question or None if complete
        next_question = await self.get_current_question(session)
        is_complete = next_question is None

        if is_complete:
            await self.session_manager.complete_interview(session_id)

        # Yield completion event
        yield {
            "type": "complete",
            "score": parsed["score"],
            "next_question": next_question.model_dump() if next_question else None,
            "is_complete": is_complete,
        }

    async def execute_code(
        self,
        session_id: str,
        question_id: str,
        code: str,
        language: str,
        test_input: Optional[str] = None,
    ) -> CodeExecutionResult:
        """Execute code for a coding question.

        Args:
            session_id: The session ID
            question_id: The question ID
            code: The code to execute
            language: Programming language
            test_input: Optional test input

        Returns:
            CodeExecutionResult with execution output
        """
        session = await self.session_manager.get(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")

        # Find the question
        question = next((q for q in session.questions if q.id == question_id), None)
        if not question:
            raise ValueError(f"Question not found: {question_id}")

        # Execute the code
        result = await self.code_executor.execute(
            code=code,
            language=language,
            test_input=test_input,
        )

        # Store the code submission
        question.code_submission = code
        question.code_language = language

        await self.session_manager.save(session)

        return result

    async def execute_code_streaming(
        self,
        session_id: str,
        question_id: str,
        code: str,
        language: str,
        test_input: Optional[str] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Execute code and stream the evaluation.

        Yields execution result then streams code review.
        """
        session = await self.session_manager.get(session_id)
        if not session:
            yield {"type": "error", "message": f"Session not found: {session_id}"}
            return

        current_question = await self.get_current_question(session)
        if not current_question:
            yield {"type": "error", "message": "No active question for this session"}
            return
        if current_question.id != question_id:
            yield {
                "type": "error",
                "message": "Question does not match current interview state",
            }
            return

        question = next((q for q in session.questions if q.id == question_id), None)
        if not question:
            yield {"type": "error", "message": f"Question not found: {question_id}"}
            return

        # Execute the code
        result = await self.code_executor.execute(
            code=code,
            language=language,
            test_input=test_input,
        )

        # Yield execution result
        yield {
            "type": "execution",
            "success": result.success,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "execution_time_ms": result.execution_time_ms,
        }

        # Stream code review
        full_response = ""
        async for chunk in self.answer_evaluator.evaluate_code_streaming(
            question=question,
            code=code,
            language=language,
            execution_result=result,
        ):
            full_response += chunk
            yield {"type": "chunk", "content": chunk}

        # Parse and update
        parsed = self.answer_evaluator.parse_full_streaming_response(full_response)

        question.code_submission = code
        question.code_language = language
        question.answer = f"Code submission:\n```{language}\n{code}\n```"
        question.score = parsed["score"]
        question.feedback = full_response
        question.answered_at = datetime.utcnow()

        session.current_question_index += 1
        await self.session_manager.save(session)

        next_question = await self.get_current_question(session)
        is_complete = next_question is None

        if is_complete:
            await self.session_manager.complete_interview(session_id)

        yield {
            "type": "complete",
            "score": parsed["score"],
            "next_question": next_question.model_dump() if next_question else None,
            "is_complete": is_complete,
        }

    async def generate_summary(
        self,
        session_id: str,
    ) -> Dict[str, Any]:
        """Generate the final interview summary.

        Args:
            session_id: The session ID

        Returns:
            Dict with summary data
        """
        session = await self.session_manager.get(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")

        summary_data = await self.summary_generator.generate_summary(session)

        # Update session with summary
        session.final_score = summary_data.get("final_score", 0)
        session.summary = summary_data.get("summary", "")
        session.strengths = summary_data.get("strengths", [])
        session.weaknesses = summary_data.get("weaknesses", [])
        session.recommendations = summary_data.get("recommendations", [])
        session.hiring_recommendation = summary_data.get(
            "hiring_recommendation", "maybe"
        )
        session.status = InterviewStatus.COMPLETED
        session.completed_at = datetime.utcnow()

        await self.session_manager.save(session)

        return summary_data

    async def generate_summary_streaming(
        self,
        session_id: str,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate summary with streaming for SSE."""
        session = await self.session_manager.get(session_id)
        if not session:
            yield {"type": "error", "message": f"Session not found: {session_id}"}
            return

        full_response = ""
        async for chunk in self.summary_generator.generate_summary_streaming(session):
            full_response += chunk
            yield {"type": "chunk", "content": chunk}

        # Parse and update session
        summary_data = self.summary_generator.parse_streaming_summary(full_response)

        # Calculate final score
        total_score = sum(q.score or 0 for q in session.questions)
        max_score = len(session.questions) * 5
        final_score = round((total_score / max_score) * 100) if max_score > 0 else 0

        session.final_score = final_score
        session.summary = full_response
        session.strengths = summary_data.get("strengths", [])
        session.weaknesses = summary_data.get("weaknesses", [])
        session.recommendations = summary_data.get("recommendations", [])
        session.hiring_recommendation = summary_data.get(
            "hiring_recommendation", "maybe"
        )
        session.status = InterviewStatus.COMPLETED
        session.completed_at = datetime.utcnow()

        await self.session_manager.save(session)

        yield {
            "type": "complete",
            "final_score": final_score,
            "hiring_recommendation": session.hiring_recommendation,
            "session": session.model_dump(),
        }

    async def skip_question(
        self,
        session_id: str,
        question_id: str,
    ) -> Dict[str, Any]:
        """Skip the current question.

        Args:
            session_id: The session ID
            question_id: The question ID to skip

        Returns:
            Dict with next question info
        """
        session = await self.session_manager.get(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")

        question = next((q for q in session.questions if q.id == question_id), None)
        if not question:
            raise ValueError(f"Question not found: {question_id}")

        # Mark as skipped with score 0
        question.answer = "[SKIPPED]"
        question.score = 0
        question.feedback = "Question was skipped by the candidate."
        question.answered_at = datetime.utcnow()

        session.current_question_index += 1
        await self.session_manager.save(session)

        next_question = await self.get_current_question(session)
        is_complete = next_question is None

        if is_complete:
            await self.session_manager.complete_interview(session_id)

        return {
            "skipped": True,
            "next_question": next_question,
            "is_complete": is_complete,
        }


# Global interview graph instance
_interview_graph: Optional[InterviewGraph] = None


def get_interview_graph() -> InterviewGraph:
    """Get the global interview graph instance."""
    global _interview_graph
    if _interview_graph is None:
        _interview_graph = InterviewGraph()
    return _interview_graph
