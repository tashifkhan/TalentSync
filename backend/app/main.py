from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.settings import get_settings
from app.core.logging import setup_logging
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
from app.routes.linkedin import router as linkedin_router
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
