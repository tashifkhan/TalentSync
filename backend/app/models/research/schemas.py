from typing import List, Optional

from pydantic import BaseModel, Field


class WebSearchRequest(BaseModel):
    query: str
    max_results: int = Field(default=5, ge=1, le=10)


class WebSearchResult(BaseModel):
    title: str
    url: str
    snippet: str


class WebSearchResponse(BaseModel):
    success: bool = True
    query: str
    results: List[WebSearchResult]
    research_summary: Optional[str] = None
