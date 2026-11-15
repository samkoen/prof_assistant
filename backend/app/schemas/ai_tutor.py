from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.services.ai_tutor_prompt import TutorAction


class TutorMessageRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    action: TutorAction | None = None
    for_practice: bool = False


class TutorMessageResponse(BaseModel):
    id: int
    role: Literal["user", "model"]
    content: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class TutorThreadResponse(BaseModel):
    question_id: int
    messages: list[TutorMessageResponse]
    remaining_messages: int
    exam_remaining_messages: int
    max_message_chars: int
    charged: bool = False
