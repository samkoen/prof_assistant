from fastapi import HTTPException

from app.config import settings
from app.schemas.gemini_questions import GeminiSeriesInput
from app.services.gemini_client import GeminiError, generate_text
from app.services.gemini_question_prompt import build_questions_generation_prompt


async def generate_exam_questions_text(
    series: list[GeminiSeriesInput],
    exam_title: str | None = None,
) -> str:
    prompt = build_questions_generation_prompt(series, exam_title)
    try:
        return await generate_text(
            prompt,
            max_output_tokens=settings.gemini_generation_max_output_tokens,
            timeout_seconds=settings.gemini_generation_timeout_seconds,
            use_generation_fallbacks=True,
        )
    except GeminiError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
