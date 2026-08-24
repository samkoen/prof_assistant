from pydantic import BaseModel, Field

from app.schemas.gemini_questions import GeminiSeriesLanguage


class OpenEvaluationRequest(BaseModel):
    regenerate: bool = False
    for_practice: bool = False


class OpenEvaluationResponse(BaseModel):
    question_id: int
    appreciation: str
    suggested_score: float
    model_answer: str | None = None
    from_cache: bool = False
    attempt_score: float | None = None
    attempt_max_score: float | None = None


class GenerateModelAnswerRequest(BaseModel):
    question_text: str = Field(min_length=1, max_length=8000)
    language: GeminiSeriesLanguage = "he"


class GenerateModelAnswerResponse(BaseModel):
    model_answer: str
