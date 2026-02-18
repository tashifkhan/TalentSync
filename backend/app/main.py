from contextlib import asynccontextmanager
import json
import logging
import time

from fastapi import Request
from starlette.responses import Response

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.logging import (
    build_request_id,
    bind_request_id,
    reset_request_id,
    setup_logging,
)
from app.core.settings import get_settings
from app.routes.ats import file_based_router as ats_file_based_router
from app.routes.ats import text_based_router as ats_text_based_router
from app.routes.cold_mail import file_based_router as cold_mail_file_based_router
from app.routes.cold_mail import text_based_router as cold_mail_text_based_router
from app.routes.hiring_assistant import (
    file_based_router as hiring_file_based_router,
)
from app.routes.hiring_assistant import (
    text_based_router as hiring_text_based_router,
)
from app.routes.interview import router as interview_router
from app.routes.linkedin import router as linkedin_router
from app.routes.llm import router as llm_router
from app.routes.postgres import router as postgres_router
from app.routes.resume_analysis import (
    file_based_router as resume_file_based_router,
)
from app.routes.resume_analysis import (
    text_based_router as resume_text_based_router,
)
from app.routes.tailored_resume import (
    file_based_router as tailored_resume_file_based_router,
)
from app.routes.tailored_resume import (
    text_based_router as tailored_resume_text_based_router,
)
from app.routes.tips import router as tips_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()
    yield
    # Shutdown
    pass


app = FastAPI(
    title=settings.APP_NAME,
    description="API for analyzing resumes, extracting structured data, and providing tips for improvement.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = build_request_id(request.headers.get("X-Request-ID"))
    token = bind_request_id(request_id)
    try:
        response = await call_next(request)
    finally:
        reset_request_id(token)
    response.headers["X-Request-ID"] = request_id
    return response


@app.middleware("http")
async def request_response_logging_middleware(request: Request, call_next):
    logger = logging.getLogger("app.request")
    response_logger = logging.getLogger("app.response")
    start_time = time.perf_counter()

    request_body = await request.body()
    request_payload = _format_payload(request_body, request.headers.get("content-type"))

    logger.debug(
        "request payload",
        extra={
            "method": request.method,
            "path": request.url.path,
            "query": request.url.query,
            "payload": request_payload,
        },
    )

    response = await call_next(request)

    response_body = b""
    async for chunk in response.body_iterator:
        response_body += chunk

    duration_ms = (time.perf_counter() - start_time) * 1000
    response_payload = _format_payload(
        response_body,
        response.headers.get("content-type"),
    )

    response_logger.debug(
        "response payload",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": round(duration_ms, 2),
            "payload": response_payload,
        },
    )

    return Response(
        content=response_body,
        status_code=response.status_code,
        headers=dict(response.headers),
        media_type=response.media_type,
        background=response.background,
    )


def _format_payload(payload: bytes, content_type: str | None) -> str:
    if not payload:
        return ""
    if content_type and "application/json" in content_type.lower():
        try:
            return json.dumps(json.loads(payload), ensure_ascii=True)
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass
    try:
        return payload.decode("utf-8")
    except UnicodeDecodeError:
        return payload.decode("utf-8", errors="replace")


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# v1 Routes
app.include_router(linkedin_router, prefix="/api/v1", tags=["LinkedIn"])
app.include_router(postgres_router, prefix="/api/v1", tags=["Database"])
app.include_router(tips_router, prefix="/api/v1", tags=["Tips"])
app.include_router(cold_mail_file_based_router, prefix="/api/v1", tags=["Cold Mail"])
app.include_router(cold_mail_text_based_router, prefix="/api/v1", tags=["Cold Mail"])
app.include_router(
    hiring_file_based_router, prefix="/api/v1", tags=["Hiring Assistant"]
)
app.include_router(resume_file_based_router, prefix="/api/v1", tags=["Resume Analysis"])
app.include_router(ats_file_based_router, prefix="/api/v1", tags=["ATS Evaluation"])
app.include_router(
    tailored_resume_file_based_router, prefix="/api/v1", tags=["Tailored Resume"]
)

# v2 Routes
app.include_router(cold_mail_text_based_router, prefix="/api/v2", tags=["Cold Mail"])
app.include_router(
    hiring_text_based_router, prefix="/api/v2", tags=["Hiring Assistant"]
)
app.include_router(resume_text_based_router, prefix="/api/v2", tags=["Resume Analysis"])
app.include_router(ats_text_based_router, prefix="/api/v2", tags=["ATS Evaluation"])
app.include_router(
    tailored_resume_text_based_router, prefix="/api/v2", tags=["Tailored Resume"]
)

# Interview Routes (v1)
app.include_router(interview_router, prefix="/api/v1", tags=["Digital Interviewer"])

# LLM Config Routes (v1)
app.include_router(llm_router, prefix="/api/v1", tags=["LLM Configuration"])
