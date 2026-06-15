from pydantic import BaseModel

from app.schemas.gemini_questions import GeminiSeriesLanguage


class AiExplanationRequest(BaseModel):
    language: GeminiSeriesLanguage = "he"
    regenerate: bool = False
    for_practice: bool = False


class AiExplanationResponse(BaseModel):
    question_id: int
    explanation: str
    from_cache: bool = False
