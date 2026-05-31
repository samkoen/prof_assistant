import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.exam import Exam
from app.models.exam_gemini_source import ExamGeminiSource, ExamGeminiSourceType
from app.models.user import User
from app.schemas.gemini_questions import GeminiSourceResponse, GeminiSourceUpdate
from app.services.exam_gemini_source_extract import (
    assert_allowed_upload,
    extract_text_from_bytes,
    truncate_text,
)
from app.services.exam_questions import exam_has_active_sessions


def _storage_root() -> Path:
    root = Path(settings.gemini_sources_dir)
    try:
        root.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        raise HTTPException(
            status_code=503,
            detail="אחסון קבצים לא זמין בשרת — נסו TXT/MD או פנו למנהל",
        ) from exc
    return root


def _persist_raw_file(exam_id: int, stored_name: str, raw: bytes) -> str:
    """Enregistre le fichier ; sur serverless sans disque, texte déjà en base."""
    rel_dir = _storage_root() / str(exam_id)
    try:
        rel_dir.mkdir(parents=True, exist_ok=True)
        full_path = rel_dir / stored_name
        full_path.write_bytes(raw)
        return str(full_path)
    except OSError:
        return f"ephemeral://{exam_id}/{stored_name}"


def _source_to_response(src: ExamGeminiSource) -> GeminiSourceResponse:
    return GeminiSourceResponse(
        id=src.id,
        exam_id=src.exam_id,
        source_type=src.source_type,
        original_filename=src.original_filename,
        char_count=src.char_count,
        use_as_style=src.use_as_style,
        use_as_content=src.use_as_content,
        created_at=src.created_at.isoformat(),
    )


def _defaults_for_type(source_type: str) -> tuple[bool, bool]:
    if source_type == ExamGeminiSourceType.EXERCISES_FILE:
        return True, False
    return False, True


async def _assert_exam_editable(exam_id: int, db: AsyncSession) -> Exam:
    exam = await db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="מבחן לא נמצא")
    if await exam_has_active_sessions(exam_id, db):
        raise HTTPException(status_code=400, detail="לא ניתן לערוך מבחן פעיל")
    return exam


async def list_sources_for_exam(
    exam_id: int, user: User, db: AsyncSession
) -> list[GeminiSourceResponse]:
    await _assert_exam_editable(exam_id, db)
    result = await db.execute(
        select(ExamGeminiSource)
        .where(ExamGeminiSource.exam_id == exam_id, ExamGeminiSource.teacher_id == user.id)
        .order_by(ExamGeminiSource.created_at.desc())
    )
    return [_source_to_response(s) for s in result.scalars().all()]


async def upload_source(
    exam_id: int,
    user: User,
    file: UploadFile,
    source_type: str,
    db: AsyncSession,
) -> GeminiSourceResponse:
    await _assert_exam_editable(exam_id, db)
    if source_type not in (
        ExamGeminiSourceType.EXERCISES_FILE,
        ExamGeminiSourceType.COURSE_FILE,
    ):
        raise HTTPException(status_code=400, detail="סוג מקור לא תקין")

    count = await db.scalar(
        select(func.count())
        .select_from(ExamGeminiSource)
        .where(ExamGeminiSource.exam_id == exam_id, ExamGeminiSource.teacher_id == user.id)
    )
    if (count or 0) >= settings.gemini_source_max_files_per_exam:
        raise HTTPException(status_code=400, detail="מגבלת מספר קבצים למבחן זה")

    raw = await file.read()
    filename = file.filename or "source.txt"
    suffix = assert_allowed_upload(filename, len(raw))
    extracted, char_count = truncate_text(extract_text_from_bytes(raw, suffix))

    total_chars = await db.scalar(
        select(func.coalesce(func.sum(ExamGeminiSource.char_count), 0)).where(
            ExamGeminiSource.exam_id == exam_id,
            ExamGeminiSource.teacher_id == user.id,
        )
    )
    if (total_chars or 0) + char_count > settings.gemini_source_max_total_chars:
        raise HTTPException(status_code=400, detail="סך הטקסט מהמקורות חורג מהמגבלה")

    style_default, content_default = _defaults_for_type(source_type)
    safe_name = Path(filename).name.replace("..", "").strip() or "source.txt"
    stored_name = f"{uuid.uuid4().hex}_{safe_name}"
    storage_path = _persist_raw_file(exam_id, stored_name, raw)

    source = ExamGeminiSource(
        exam_id=exam_id,
        teacher_id=user.id,
        source_type=source_type,
        original_filename=safe_name,
        storage_path=storage_path,
        extracted_text=extracted,
        char_count=char_count,
        use_as_style=style_default,
        use_as_content=content_default,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)
    return _source_to_response(source)


async def update_source_flags(
    source_id: int, user: User, body: GeminiSourceUpdate, db: AsyncSession
) -> GeminiSourceResponse:
    source = await _load_owned_source(source_id, user, db)
    await _assert_exam_editable(source.exam_id, db)
    if body.use_as_style is not None:
        source.use_as_style = body.use_as_style
    if body.use_as_content is not None:
        source.use_as_content = body.use_as_content
    if not source.use_as_style and not source.use_as_content:
        raise HTTPException(status_code=400, detail="יש לבחור לפחות שימוש אחד למקור")
    await db.commit()
    await db.refresh(source)
    return _source_to_response(source)


async def delete_source(source_id: int, user: User, db: AsyncSession) -> None:
    source = await _load_owned_source(source_id, user, db)
    await _assert_exam_editable(source.exam_id, db)
    if not source.storage_path.startswith("ephemeral://"):
        path = Path(source.storage_path)
        if path.is_file():
            path.unlink(missing_ok=True)
    await db.delete(source)
    await db.commit()


async def load_sources_for_generation(
    exam_id: int, user: User, source_ids: list[int], db: AsyncSession
) -> list[ExamGeminiSource]:
    if not source_ids:
        return []
    result = await db.execute(
        select(ExamGeminiSource).where(
            ExamGeminiSource.exam_id == exam_id,
            ExamGeminiSource.teacher_id == user.id,
            ExamGeminiSource.id.in_(source_ids),
        )
    )
    sources = list(result.scalars().all())
    if len(sources) != len(set(source_ids)):
        raise HTTPException(status_code=400, detail="מקור לא נמצא")
    active = [s for s in sources if s.use_as_style or s.use_as_content]
    if source_ids and not active:
        raise HTTPException(status_code=400, detail="לא נבחר שימוש במקורות")
    return active


async def _load_owned_source(
    source_id: int, user: User, db: AsyncSession
) -> ExamGeminiSource:
    source = await db.get(ExamGeminiSource, source_id)
    if not source or source.teacher_id != user.id:
        raise HTTPException(status_code=404, detail="מקור לא נמצא")
    return source
