from fastapi import HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exam import Exam
from app.models.exam_gemini_source import ExamGeminiSource, ExamGeminiSourceType
from app.models.user import User
from app.schemas.gemini_questions import (
    GeminiGenerationPreviewResponse,
    GeminiSeriesInput,
    GeminiSourcePreviewItem,
)
from app.services.ai_client import AiError, generate_text
from app.services.ai_prompt_render import render_prompt
from app.services.ai_prompt_store import get_prompt_body
from app.services.exam_gemini_source_service import load_sources_for_generation
from app.services.gemini_text_cleanup import clean_gemini_source_text, clean_gemini_user_text

SOURCE_PREVIEW_CHARS = 500

_TYPE_LABELS = {
    ExamGeminiSourceType.EXERCISES_FILE: "sample exercises",
    ExamGeminiSourceType.COURSE_FILE: "course material",
}


def _instructions_from_series(series: list[GeminiSeriesInput]) -> list[str]:
    return [clean_gemini_user_text(s.instructions) for s in series]


def _source_preview_item(src: ExamGeminiSource) -> GeminiSourcePreviewItem:
    text = clean_gemini_source_text(src.extracted_text)
    preview = text[:SOURCE_PREVIEW_CHARS]
    if len(text) > SOURCE_PREVIEW_CHARS:
        preview = f"{preview}…"
    return GeminiSourcePreviewItem(
        id=src.id,
        original_filename=src.original_filename,
        source_type=src.source_type,
        use_as_style=src.use_as_style,
        use_as_content=src.use_as_content,
        text_preview=preview,
    )


def _source_roles_line(src: GeminiSourcePreviewItem) -> str:
    roles: list[str] = []
    if src.use_as_style:
        roles.append("style")
    if src.use_as_content:
        roles.append("content")
    label = _TYPE_LABELS.get(src.source_type, src.source_type)
    return f"{src.original_filename} ({label}: {', '.join(roles)})"


def _build_summary_prompt(
    instructions: list[str],
    sources: list[GeminiSourcePreviewItem],
    total_questions: int,
    exam_title: str | None,
) -> str:
    instr_block = "\n".join(f"- {line}" for line in instructions)
    if sources:
        src_block = "\n".join(f"- {_source_roles_line(s)}" for s in sources)
    else:
        src_block = "- none"
    title_line = f"Exam: {clean_gemini_user_text(exam_title)}\n" if exam_title else ""
    return render_prompt(
        get_prompt_body("generation.preview"),
        {
            "title_line": title_line,
            "total_questions": total_questions,
            "instructions": instr_block,
            "sources": src_block,
        },
    )


async def preview_generation_context(
    exam: Exam,
    user: User,
    series: list[GeminiSeriesInput],
    source_ids: list[int],
    db: AsyncSession,
) -> GeminiGenerationPreviewResponse:
    ids = source_ids or []
    sources = await load_sources_for_generation(exam.id, user, ids, db)
    instructions = _instructions_from_series(series)
    preview_sources = [_source_preview_item(s) for s in sources]
    total = sum(s.question_count for s in series)
    prompt = _build_summary_prompt(instructions, preview_sources, total, exam.title)
    try:
        ai_summary = (await generate_text(prompt, for_generation=True)).strip()
    except AiError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not ai_summary:
        ai_summary = f"נושא מובן: {instructions[0][:80]}… · מקורות: {'ללא' if not preview_sources else str(len(preview_sources))} · {total} שאלות"
    return GeminiGenerationPreviewResponse(
        instructions=instructions,
        total_questions=total,
        sources=preview_sources,
        ai_summary=ai_summary,
    )
