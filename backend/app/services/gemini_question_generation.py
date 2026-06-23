from fastapi import HTTPException

from app.schemas.gemini_questions import GeminiSeriesInput
from app.services.gemini_question_prompt import build_questions_generation_prompt
from app.services.opencode_client import OpenCodeError, generate_text


async def generate_exam_questions_text(
    series: list[GeminiSeriesInput],
    exam_title: str | None = None,
) -> str:
    prompt = build_questions_generation_prompt(series, exam_title)
    try:
        return await generate_text(prompt, for_generation=True)
    except OpenCodeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
