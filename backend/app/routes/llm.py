from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.llm import create_llm

router = APIRouter()


class LLMTestRequest(BaseModel):
    provider: str
    model: str
    api_key: Optional[str] = None
    api_base: Optional[str] = None


class LLMTestResponse(BaseModel):
    success: bool
    message: str


@router.post("/llm/test", response_model=LLMTestResponse)
async def test_llm_connection(request: LLMTestRequest):
    try:
        # Create LLM instance
        # We assume api_key is passed as plaintext (decrypted by frontend proxy)
        llm = create_llm(
            provider=request.provider,
            model=request.model,
            api_key=request.api_key,
            api_base=request.api_base,
            temperature=0.7,
        )

        # Test invocation
        response = await llm.ainvoke("Hi")

        # Check response content
        if response and response.content:
            return LLMTestResponse(
                success=True,
                message=f"Connection successful. Response: {str(response.content)[:50]}...",
            )
        else:
            return LLMTestResponse(success=False, message="LLM returned empty response")

    except Exception as e:
        return LLMTestResponse(success=False, message=f"Connection failed: {str(e)}")
