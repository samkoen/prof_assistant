from fastapi import HTTPException

from app.models.user import User
from app.schemas.gemini_questions import GeminiSeriesInput
from app.services.gemini_question_prompt import build_questions_generation_prompt
from app.services.ai_client import AiError, generate_text
from app.services.billing.balance import product_for_role
from app.services.billing.constants import TEACHER_GENERATION
from app.services.billing.context import bill_ai, role_name


async def generate_exam_questions_text(
    series: list[GeminiSeriesInput],
    exam_title: str | None = None,
    *,
    user: User,
) -> str:
    prompt = build_questions_generation_prompt(series, exam_title)
    product = product_for_role(role_name(user)) or TEACHER_GENERATION
    try:
        async with bill_ai(user, product):
            return await generate_text(prompt, for_generation=True)
    except AiError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
