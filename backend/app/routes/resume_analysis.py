from fastapi import APIRouter, Depends, File, Form, UploadFile
from langchain_core.language_models import BaseChatModel

from app.core.deps import get_request_llm
from app.models.schemas import (
    ComprehensiveAnalysisData,
    ComprehensiveAnalysisResponse,
    FormattedAndAnalyzedResumeResponse,
    ResumeUploadResponse,
)
from app.services import resume_analysis

file_based_router = APIRouter()


@file_based_router.post(
    "/resume/analysis",
    summary="Analyze Resume",
    response_model=ResumeUploadResponse,
)
async def analyze_resume(
    file: UploadFile = File(...),
    llm: BaseChatModel = Depends(get_request_llm),
):
    return resume_analysis.analyze_resume_service(file, llm)


@file_based_router.post(
    "/resume/comprehensive/analysis/",
    response_model=ComprehensiveAnalysisResponse,
    description="Performs a comprehensive analysis of the uploaded resume using LLM.",
)
async def comprehensive_resume_analysis(
    file: UploadFile = File(...),
    llm: BaseChatModel = Depends(get_request_llm),
):
    return await resume_analysis.comprehensive_resume_analysis_service(file, llm)


text_based_router = APIRouter()


@text_based_router.post(
    "/resume/format-and-analyze",
    summary="Format, Clean, and Analyze Resume from File V2",
    response_model=FormattedAndAnalyzedResumeResponse,
)
async def format_and_analyze_resume_v2(
    file: UploadFile = File(...),
    llm: BaseChatModel = Depends(get_request_llm),
):
    return await resume_analysis.format_and_analyze_resume_service(file, llm)


@text_based_router.post(
    "/resume/analysis",
    summary="Analyze Resume V2",
    response_model=ComprehensiveAnalysisData,
)
async def analyze_resume_v2(
    formated_resume: str = Form(
        ...,
        description="Formatted resume text",
    ),
    llm: BaseChatModel = Depends(get_request_llm),
):
    return await resume_analysis.analyze_resume_v2_service(formated_resume, llm)
