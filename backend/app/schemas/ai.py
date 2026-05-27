from pydantic import BaseModel


class AiExplanationResponse(BaseModel):
    question_id: int
    explanation: str
