import re
import shutil
import uuid
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.course import CourseCatalog
from app.models.enums import UserRole
from app.models.exam import Exam, ExamSession, StudentExamAttempt
from app.models.user import User
from app.services.catalog_scope import teacher_can_edit_catalog_item
from app.services.exam_questions import exam_has_active_sessions

_ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
_MEDIA_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
}
_URL_PATTERN = re.compile(r"^/api/exams/(\d+)/question-images/([a-zA-Z0-9._-]+)$")


def _storage_root() -> Path:
    root = Path(settings.question_images_dir)
    try:
        root.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        raise HTTPException(status_code=503, detail="אחסון תמונות לא זמין בשרת") from exc
    return root


def _exam_dir(exam_id: int) -> Path:
    path = _storage_root() / str(exam_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


def validate_image_upload(filename: str, size: int) -> str:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in _ALLOWED_SUFFIXES:
        raise HTTPException(
            status_code=400,
            detail="סוג קובץ לא נתמך — JPG, PNG, GIF או WebP בלבד",
        )
    if size > settings.question_image_max_bytes:
        raise HTTPException(status_code=400, detail="התמונה גדולה מדי (מקסימום 5MB)")
    return suffix


def build_image_url(exam_id: int, stored_name: str) -> str:
    return f"/api/exams/{exam_id}/question-images/{stored_name}"


def parse_image_url(url: str | None) -> tuple[int, str] | None:
    if not url:
        return None
    match = _URL_PATTERN.match(url.strip())
    if not match:
        return None
    return int(match.group(1)), match.group(2)


def safe_filename(name: str) -> str:
    if not name or ".." in name or "/" in name or "\\" in name:
        raise HTTPException(status_code=400, detail="שם קובץ לא תקין")
    return name


def resolve_image_file(exam_id: int, filename: str) -> Path:
    safe = safe_filename(filename)
    path = _exam_dir(exam_id) / safe
    if not path.is_file():
        raise HTTPException(status_code=404, detail="תמונה לא נמצאה")
    return path


def media_type_for(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    return _MEDIA_TYPES.get(suffix, "application/octet-stream")


async def assert_exam_editable_for_images(exam_id: int, db: AsyncSession) -> Exam:
    exam = await db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="מבחן לא נמצא")
    if await exam_has_active_sessions(exam_id, db):
        raise HTTPException(status_code=400, detail="לא ניתן לערוך מבחן פעיל")
    return exam


async def assert_can_view_question_images(exam_id: int, user: User, db: AsyncSession) -> None:
    exam = await db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="מבחן לא נמצא")
    if user.role == UserRole.ADMIN:
        return
    if user.role == UserRole.TEACHER:
        catalog = await db.get(CourseCatalog, exam.catalog_course_id)
        if catalog and teacher_can_edit_catalog_item(exam, user, catalog.created_by_id):
            return
    count = await db.scalar(
        select(func.count())
        .select_from(StudentExamAttempt)
        .join(ExamSession, StudentExamAttempt.exam_session_id == ExamSession.id)
        .where(ExamSession.exam_id == exam_id, StudentExamAttempt.student_id == user.id)
    )
    if count:
        return
    raise HTTPException(status_code=403, detail="אין הרשאה")


async def upload_question_image(
    exam_id: int,
    file: UploadFile,
    db: AsyncSession,
) -> dict[str, str]:
    await assert_exam_editable_for_images(exam_id, db)
    raw = await file.read()
    suffix = validate_image_upload(file.filename or "", len(raw))
    stored_name = f"{uuid.uuid4().hex}{suffix}"
    dest = _exam_dir(exam_id) / stored_name
    try:
        dest.write_bytes(raw)
    except OSError as exc:
        raise HTTPException(status_code=503, detail="שמירת התמונה נכשלה") from exc
    return {"url": build_image_url(exam_id, stored_name)}


def local_path_from_image_url(url: str | None) -> Path | None:
    """Chemin disque local pour une URL d'image question ; None si absent ou invalide."""
    parsed = parse_image_url(url)
    if not parsed:
        return None
    exam_id, filename = parsed
    if not filename or ".." in filename or "/" in filename or "\\" in filename:
        return None
    path = _storage_root() / str(exam_id) / filename
    return path if path.is_file() else None


def open_image_for_pdf(path: Path) -> str | BytesIO:
    """Retourne un chemin ou un buffer JPEG utilisable par fpdf2."""
    suffix = path.suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".gif"}:
        return str(path)
    try:
        from PIL import Image
    except ImportError:
        return str(path)
    with Image.open(path) as img:
        rgb = img.convert("RGB")
        buf = BytesIO()
        rgb.save(buf, format="JPEG", quality=88)
        buf.seek(0)
        return buf


def copy_image_url_for_duplicate(url: str | None, source_exam_id: int, target_exam_id: int) -> str | None:
    parsed = parse_image_url(url)
    if not parsed:
        return url
    exam_id, filename = parsed
    if exam_id != source_exam_id:
        return url
    src = _exam_dir(source_exam_id) / filename
    if not src.is_file():
        return None
    dest = _exam_dir(target_exam_id) / filename
    try:
        shutil.copy2(src, dest)
    except OSError:
        return None
    return build_image_url(target_exam_id, filename)
