from pydantic import BaseModel, Field


class AiPromptUpdate(BaseModel):
    body: str = Field(min_length=1, max_length=50000)


class AiPromptTemplateOut(BaseModel):
    key: str
    body: str
    version: int
    updated_at: str | None
    placeholders: list[str]
    required: list[str]
    is_custom: bool
