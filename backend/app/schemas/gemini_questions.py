from typing import Literal

from pydantic import BaseModel, Field

from app.models.enums import QuestionType

GeminiSeriesLevel = Literal["easy", "medium", "hard"]
GeminiSeriesLanguage = Literal["he", "fr", "en", "ru"]


class GeminiSeriesInput(BaseModel):
    subject: str = Field(min_length=1, max_length=500)
    question_count: int = Field(ge=1, le=50)
    level: GeminiSeriesLevel
    question_types: list[QuestionType] = Field(min_length=1, max_length=3)
    language: GeminiSeriesLanguage = "he"


class GeminiGenerateQuestionsRequest(BaseModel):
    series: list[GeminiSeriesInput] = Field(min_length=1, max_length=20)


class GeminiGenerateQuestionsResponse(BaseModel):
    raw_text: str
