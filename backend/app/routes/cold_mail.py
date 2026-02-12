from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from langchain_core.language_models import BaseChatModel

from app.core.deps import get_request_llm
from app.models.schemas import ColdMailResponse
from app.services import cold_mail

file_based_router = APIRouter()


@file_based_router.post(
    "/cold-mail/generator/",
    response_model=ColdMailResponse,
    description="Generates a cold email based on the provided resume and user inputs.",
)
async def cold_mail_generator(
    file: UploadFile = File(...),
    recipient_name: str = Form(...),
    recipient_designation: str = Form(...),
    company_name: str = Form(...),
    sender_name: str = Form(...),
    sender_role_or_goal: str = Form(...),
    key_points_to_include: str = Form(...),
    additional_info_for_llm: Optional[str] = Form(""),
    company_url: Optional[str] = Form(None),
    llm: BaseChatModel = Depends(get_request_llm),
):
    return cold_mail.cold_mail_generator_service(
        file,
        recipient_name,
        recipient_designation,
        company_name,
        sender_name,
        sender_role_or_goal,
        key_points_to_include,
        additional_info_for_llm,
        company_url,
        llm,
    )


@file_based_router.post(
    "/cold-mail/editor/",
    response_model=ColdMailResponse,
    description="Edit a cold email based on the provided resume and user inputs.",
)
async def cold_mail_editor(
    file: UploadFile = File(...),
    recipient_name: str = Form(...),
    recipient_designation: str = Form(...),
    company_name: str = Form(...),
    sender_name: str = Form(...),
    sender_role_or_goal: str = Form(...),
    key_points_to_include: str = Form(...),
    additional_info_for_llm: Optional[str] = Form(""),
    company_url: Optional[str] = Form(None),
    generated_email_subject: str = Form(""),
    generated_email_body: str = Form(""),
    edit_inscription: str = Form(""),
    llm: BaseChatModel = Depends(get_request_llm),
):
    return cold_mail.cold_mail_editor_service(
        file,
        recipient_name,
        recipient_designation,
        company_name,
        sender_name,
        sender_role_or_goal,
        key_points_to_include,
        additional_info_for_llm,
        company_url,
        generated_email_subject,
        generated_email_body,
        edit_inscription,
        llm,
    )


text_based_router = APIRouter()


@text_based_router.post(
    "/cold-mail/generator/",
    response_model=ColdMailResponse,
    description="Generates a cold email based on the provided resume text and user inputs.",
)
async def cold_mail_generator_v2(
    resume_text: str = Form(...),
    recipient_name: str = Form(...),
    recipient_designation: str = Form(...),
    company_name: str = Form(...),
    sender_name: str = Form(...),
    sender_role_or_goal: str = Form(...),
    key_points_to_include: str = Form(...),
    additional_info_for_llm: Optional[str] = Form(""),
    company_url: Optional[str] = Form(None),
    llm: BaseChatModel = Depends(get_request_llm),
):
    return await cold_mail.cold_mail_generator_v2_service(
        resume_text,
        recipient_name,
        recipient_designation,
        company_name,
        sender_name,
        sender_role_or_goal,
        key_points_to_include,
        additional_info_for_llm,
        company_url,
        llm,
    )


@text_based_router.post(
    "/cold-mail/edit/",
    response_model=ColdMailResponse,
    description="Edit a cold email based on the provided resume text and user inputs.",
)
async def cold_mail_editor_v2(
    resume_text: str = Form(...),
    recipient_name: str = Form(...),
    recipient_designation: str = Form(...),
    company_name: str = Form(...),
    sender_name: str = Form(...),
    sender_role_or_goal: str = Form(...),
    key_points_to_include: str = Form(...),
    additional_info_for_llm: Optional[str] = Form(""),
    company_url: Optional[str] = Form(None),
    generated_email_subject: str = Form(...),
    generated_email_body: str = Form(...),
    edit_inscription: str = Form(""),
    llm: BaseChatModel = Depends(get_request_llm),
):
    return await cold_mail.cold_mail_editor_v2_service(
        resume_text,
        recipient_name,
        recipient_designation,
        company_name,
        sender_name,
        sender_role_or_goal,
        key_points_to_include,
        additional_info_for_llm,
        company_url,
        generated_email_subject,
        generated_email_body,
        edit_inscription,
        llm,
    )
