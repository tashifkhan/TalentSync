import logging
import os
from typing import Optional, cast

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from langchain_core.language_models import BaseChatModel
from pydantic import BaseModel, Field, ValidationError, model_validator
from starlette.datastructures import UploadFile as StarletteUploadFile

from app.core.deps import get_request_llm
from app.models.schemas import JDEvaluatorResponse
from app.services.ats import ats_evaluate_service
from app.services.process_resume import process_document

file_based_router = APIRouter()
text_based_router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_JD_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".md"}


class ATSEvaluationPayload(BaseModel):
    resume_text: str = Field(
        ..., min_length=1, description="Resume content to evaluate"
    )
    jd_text: Optional[str] = Field(
        default=None,
        description="Raw job description text. Required if jd_link is not provided.",
    )
    jd_link: Optional[str] = Field(
        default=None,
        description="URL pointing to the job description. Used when jd_text is not supplied.",
    )
    company_name: Optional[str] = Field(
        default=None,
        description="Optional company name for additional context.",
    )
    company_website: Optional[str] = Field(
        default=None,
        description="Optional company website content or URL for enrichment.",
    )

    @model_validator(mode="after")
    def ensure_job_description_source(self) -> "ATSEvaluationPayload":
        if not (self.jd_text or self.jd_link):
            raise ValueError("Either jd_text or jd_link must be provided.")
        return self


@text_based_router.post(
    "/ats/evaluate",
    response_model=JDEvaluatorResponse,
    summary="Evaluate resume against a job description.",
)
async def evaluate_ats(
    request: Request,
    llm: BaseChatModel = Depends(get_request_llm),
) -> JDEvaluatorResponse:
    payload: Optional[ATSEvaluationPayload] = None
    try:
        content_type = request.headers.get("content-type", "")
        if content_type.startswith("multipart/form-data") or content_type.startswith(
            "application/x-www-form-urlencoded"
        ):
            form = await request.form()
            jd_file = form.get("jd_file")

            def _form_text(value: object) -> Optional[str]:
                if isinstance(value, str):
                    cleaned = cast(str, value).strip()
                    return cleaned or None
                return None

            resume_text = _form_text(form.get("resume_text")) or ""
            jd_text = _form_text(form.get("jd_text"))
            jd_link = _form_text(form.get("jd_link"))
            company_name = _form_text(form.get("company_name"))
            company_website = _form_text(form.get("company_website"))

            if isinstance(jd_file, (UploadFile, StarletteUploadFile)):
                jd_extension = os.path.splitext(jd_file.filename or "")[1].lower()
                if jd_extension and jd_extension not in ALLOWED_JD_EXTENSIONS:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "Unsupported JD file type. Allowed: PDF, DOC, DOCX, TXT, MD."
                        ),
                    )
                jd_bytes = await jd_file.read()
                jd_file_text = process_document(jd_bytes, jd_file.filename)
                if not jd_file_text:
                    raise HTTPException(
                        status_code=400, detail="Failed to process JD file."
                    )
                jd_text = jd_file_text

            payload = ATSEvaluationPayload.model_validate(
                {
                    "resume_text": resume_text,
                    "jd_text": jd_text,
                    "jd_link": jd_link,
                    "company_name": company_name,
                    "company_website": company_website,
                }
            )
        else:
            data = await request.json()
            payload = ATSEvaluationPayload.model_validate(data)

        return await ats_evaluate_service(
            resume_text=payload.resume_text,
            jd_text=payload.jd_text,
            jd_link=payload.jd_link,
            company_name=payload.company_name,
            company_website=payload.company_website,
            llm=llm,
        )

    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception:
        logger.exception(
            "ATS evaluation request failed",
            extra={
                "company_name": payload.company_name if payload else None,
                "has_jd_text": bool(payload.jd_text) if payload else False,
                "has_jd_link": bool(payload.jd_link) if payload else False,
            },
        )
        raise


@file_based_router.post(
    "/ats/evaluate",
    response_model=JDEvaluatorResponse,
    summary="Evaluate resume against a job description (file-based).",
    description=(
        "Upload a resume file and optionally a job description file or provide a JD link."
    ),
)
async def evaluate_ats_file_based(
    resume_file: UploadFile = File(...),
    jd_file: Optional[UploadFile] = File(None),
    jd_text: Optional[str] = Form(None),
    jd_link: Optional[str] = Form(None),
    company_name: Optional[str] = Form(None),
    company_website: Optional[str] = Form(None),
    llm: BaseChatModel = Depends(get_request_llm),
) -> JDEvaluatorResponse:
    # Read and process resume file
    resume_bytes = await resume_file.read()
    resume_text = process_document(resume_bytes, resume_file.filename)
    if not resume_text:
        raise HTTPException(status_code=400, detail="Failed to process resume file.")

    # Determine JD text: prefer file upload over raw text form field
    if jd_file is not None:
        jd_extension = os.path.splitext(jd_file.filename or "")[1].lower()
        if jd_extension and jd_extension not in ALLOWED_JD_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail="Unsupported JD file type. Allowed: PDF, DOC, DOCX, TXT, MD.",
            )
        jd_bytes = await jd_file.read()
        jd_file_text = process_document(jd_bytes, jd_file.filename)
        if not jd_file_text:
            raise HTTPException(status_code=400, detail="Failed to process JD file.")
        jd_text = jd_file_text

    if not jd_text and not jd_link:
        raise HTTPException(
            status_code=400,
            detail="A job description must be provided (text, file, or link).",
        )

    return await ats_evaluate_service(
        resume_text=resume_text,
        jd_text=jd_text,
        jd_link=jd_link,
        company_name=company_name,
        company_website=company_website,
        llm=llm,
    )
