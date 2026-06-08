from typing import Literal

from pydantic import BaseModel, Field

from app.models.enums import QuestionType

GeminiSeriesLevel = Literal["easy", "medium", "hard"]
GeminiSeriesLanguage = Literal["he", "fr", "en", "ru"]


class GeminiSeriesInput(BaseModel):
    instructions: str = Field(min_length=1, max_length=4000)
    question_count: int = Field(ge=1, le=50)
    level: GeminiSeriesLevel
    question_types: list[QuestionType] = Field(min_length=1, max_length=3)
    language: GeminiSeriesLanguage = "he"


class GeminiGenerateQuestionsRequest(BaseModel):
    series: list[GeminiSeriesInput] = Field(min_length=1, max_length=20)


class GeminiGenerateQuestionsResponse(BaseModel):
    raw_text: str


class GeminiSourceResponse(BaseModel):
    id: int
    exam_id: int
    source_type: str
    original_filename: str
    char_count: int
    use_as_style: bool
    use_as_content: bool
    created_at: str


class GeminiSourceUpdate(BaseModel):
    use_as_style: bool | None = None
    use_as_content: bool | None = None


class GeminiSessionCreateRequest(BaseModel):
    series: list[GeminiSeriesInput] = Field(min_length=1, max_length=20)
    source_ids: list[int] = Field(default_factory=list, max_length=10)


class GeminiSessionRefineRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class GeminiSessionMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: str


class GeminiSessionResponse(BaseModel):
    id: int
    exam_id: int
    status: str
    raw_text: str | None
    messages: list[GeminiSessionMessageResponse]


class GeminiSessionAcceptResponse(BaseModel):
    imported_count: int


class GeminiParseErrorItem(BaseModel):
    block: int = 0
    message: str = Field(min_length=1, max_length=500)


class GeminiParseErrorReportRequest(BaseModel):
    errors: list[GeminiParseErrorItem] = Field(min_length=1, max_length=50)
