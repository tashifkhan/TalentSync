"""Interview API routes with SSE streaming support."""

import json
from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.interview.schemas import (
    CodeExecutionRequest,
    CreateInterviewRequest,
    InterviewEventRequest,
    InterviewSessionResponse,
    SubmitAnswerRequest,
)
from app.models.interview.templates import list_templates, get_template
from app.models.interview.enums import InterviewEventType
from app.services.interview.graph import get_interview_graph
from app.models.interview.schemas import InterviewEvent
from app.services.interview.session_manager import get_session_manager


router = APIRouter(prefix="/interview", tags=["Digital Interviewer"])


# ============== Helper Functions ==============


async def sse_generator(async_gen):
    """Convert async generator to SSE format."""
    try:
        async for data in async_gen:
            event_type = data.get("type", "message")
            json_data = json.dumps(data)
            yield f"event: {event_type}\ndata: {json_data}\n\n"
    except Exception as e:
        error_data = json.dumps({"type": "error", "message": str(e)})
        yield f"event: error\ndata: {error_data}\n\n"


# ============== Template Endpoints ==============


@router.get("/templates")
async def get_templates():
    """List all available interview templates."""
    templates = list_templates()
    return {"templates": templates}


@router.get("/templates/{template_id}")
async def get_template_by_id(template_id: str):
    """Get a specific interview template by ID."""
    template = get_template(template_id)
    if not template:
        raise HTTPException(
            status_code=404, detail=f"Template not found: {template_id}"
        )
    return {"template": template.model_dump()}


# ============== Session Endpoints ==============


@router.post("/sessions", response_model=InterviewSessionResponse)
async def create_interview_session(request: CreateInterviewRequest):
    """Create a new interview session and generate questions.

    This endpoint creates a new interview session with the provided
    candidate profile and interview configuration. Questions are
    automatically generated based on the configuration.
    """
    try:
        graph = get_interview_graph()
        session = await graph.create_session(
            profile=request.profile,
            config=request.config,
        )

        current_question = await graph.get_current_question(session)

        return InterviewSessionResponse(
            session=session,
            current_question=current_question,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}", response_model=InterviewSessionResponse)
async def get_interview_session(session_id: str):
    """Get an interview session by ID."""
    graph = get_interview_graph()
    session = await graph.get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")

    current_question = await graph.get_current_question(session)

    return InterviewSessionResponse(
        session=session,
        current_question=current_question,
    )


@router.delete("/sessions/{session_id}")
async def delete_interview_session(session_id: str):
    """Delete an interview session."""
    manager = get_session_manager()
    deleted = await manager.delete(session_id)

    if not deleted:
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")

    return {"deleted": True, "session_id": session_id}


@router.get("/sessions")
async def list_interview_sessions(
    status: str = "",
    limit: int = 100,
):
    """List interview sessions with optional filtering."""
    manager = get_session_manager()

    # Convert status string to enum if provided
    status_enum = None
    if status:
        from app.models.interview.enums import InterviewStatus

        try:
            status_enum = InterviewStatus(status)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status: {status}. Valid values: {[s.value for s in InterviewStatus]}",
            )

    sessions = await manager.list_sessions(status=status_enum, limit=limit)

    return {
        "sessions": [s.model_dump() for s in sessions],
        "count": len(sessions),
    }


# ============== Answer Submission Endpoints ==============


@router.post("/sessions/{session_id}/answer")
async def submit_answer(session_id: str, request: SubmitAnswerRequest):
    """Submit an answer for evaluation (non-streaming).

    Returns the evaluation result and next question.
    """
    try:
        graph = get_interview_graph()
        result = await graph.submit_answer(
            session_id=session_id,
            question_id=request.question_id,
            answer=request.answer,
        )

        return {
            "score": result["evaluation"].score,
            "feedback": result["evaluation"].feedback,
            "strengths": result["evaluation"].strengths,
            "improvements": result["evaluation"].improvements,
            "next_question": result["next_question"].model_dump()
            if result["next_question"]
            else None,
            "is_complete": result["is_complete"],
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/answer/stream")
async def submit_answer_streaming(session_id: str, request: SubmitAnswerRequest):
    """Submit an answer with SSE streaming evaluation.

    Streams the evaluation response token by token for a typing effect.

    SSE Events:
    - chunk: Partial evaluation text
    - complete: Final result with score and next question
    - error: Error message
    """
    graph = get_interview_graph()

    # Verify session exists
    session = await graph.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")

    async_gen = graph.submit_answer_streaming(
        session_id=session_id,
        question_id=request.question_id,
        answer=request.answer,
    )

    return StreamingResponse(
        sse_generator(async_gen),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ============== Code Execution Endpoints ==============


@router.post("/sessions/{session_id}/code")
async def execute_code(session_id: str, request: CodeExecutionRequest):
    """Execute code for a coding question (non-streaming).

    Returns execution result and code review.
    """
    try:
        graph = get_interview_graph()
        result = await graph.execute_code(
            session_id=session_id,
            question_id=request.question_id,
            code=request.code,
            language=request.language,
            test_input=request.test_input,
        )

        return result.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/code/stream")
async def execute_code_streaming(session_id: str, request: CodeExecutionRequest):
    """Execute code with SSE streaming evaluation.

    First returns execution result, then streams code review.

    SSE Events:
    - execution: Code execution result (success, stdout, stderr)
    - chunk: Partial code review text
    - complete: Final result with score and next question
    - error: Error message
    """
    graph = get_interview_graph()

    session = await graph.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")

    async_gen = graph.execute_code_streaming(
        session_id=session_id,
        question_id=request.question_id,
        code=request.code,
        language=request.language,
        test_input=request.test_input,
    )

    return StreamingResponse(
        sse_generator(async_gen),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/code/languages")
async def get_supported_languages():
    """Get list of supported programming languages for code execution."""
    from app.services.interview.code_executor import CodeExecutor

    executor = CodeExecutor()
    return {"languages": executor.get_supported_languages()}


# ============== Skip Question Endpoint ==============


@router.post("/sessions/{session_id}/skip")
async def skip_question(session_id: str, question_id: str):
    """Skip the current question.

    The question will be marked as skipped with a score of 0.
    """
    try:
        graph = get_interview_graph()
        result = await graph.skip_question(
            session_id=session_id,
            question_id=question_id,
        )

        return {
            "skipped": True,
            "next_question": result["next_question"].model_dump()
            if result["next_question"]
            else None,
            "is_complete": result["is_complete"],
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== Summary Endpoints ==============


@router.get("/sessions/{session_id}/summary")
async def get_interview_summary(session_id: str):
    """Get the final interview summary (non-streaming).

    If summary doesn't exist, it will be generated.
    """
    try:
        graph = get_interview_graph()
        session = await graph.get_session(session_id)

        if not session:
            raise HTTPException(
                status_code=404, detail=f"Session not found: {session_id}"
            )

        # Check if summary already exists
        if session.summary:
            return {
                "session_id": session.session_id,
                "final_score": session.final_score,
                "summary": session.summary,
                "strengths": session.strengths,
                "weaknesses": session.weaknesses,
                "recommendations": session.recommendations,
                "hiring_recommendation": session.hiring_recommendation,
            }

        # Generate summary
        summary_data = await graph.generate_summary(session_id)

        return {
            "session_id": session_id,
            **summary_data,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/summary/stream")
async def generate_summary_streaming(session_id: str):
    """Generate interview summary with SSE streaming.

    SSE Events:
    - chunk: Partial summary text
    - complete: Final summary with score and recommendation
    - error: Error message
    """
    graph = get_interview_graph()

    session = await graph.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")

    async_gen = graph.generate_summary_streaming(session_id)

    return StreamingResponse(
        sse_generator(async_gen),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ============== Event Recording Endpoints ==============


@router.post("/sessions/{session_id}/events")
async def record_interview_event(session_id: str, request: InterviewEventRequest):
    """Record an interview event (e.g., tab switch).

    Used for integrity tracking during the interview.
    """
    manager = get_session_manager()
    session = await manager.get(session_id)

    if not session:
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")

    event = InterviewEvent(
        session_id=session_id,
        event_type=request.event_type,
        metadata=request.metadata,
    )

    await manager.record_event(event)

    # Get updated counts
    tab_switch_count = await manager.count_events(
        session_id, InterviewEventType.TAB_SWITCH
    )

    return {
        "recorded": True,
        "event_type": request.event_type.value,
        "tab_switch_count": tab_switch_count,
        "warning": tab_switch_count >= 3,  # Flag for review if 3+ tab switches
    }


@router.get("/sessions/{session_id}/events")
async def get_interview_events(
    session_id: str,
    event_type: str = "",
):
    """Get events for an interview session."""
    manager = get_session_manager()

    session = await manager.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")

    # Convert event type string to enum if provided
    event_type_enum = None
    if event_type:
        try:
            event_type_enum = InterviewEventType(event_type)
        except ValueError:
            raise HTTPException(
                status_code=400, detail=f"Invalid event type: {event_type}"
            )

    events = await manager.get_events(session_id, event_type_enum)

    return {
        "events": [e.model_dump() for e in events],
        "count": len(events),
    }


# ============== Health/Stats Endpoints ==============


@router.get("/health")
async def interview_health():
    """Health check for the interview service."""
    manager = get_session_manager()
    return {
        "status": "healthy",
        "active_sessions": manager.get_session_count(),
    }
