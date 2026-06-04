from io import BytesIO
from pathlib import Path

from fastapi import HTTPException

from app.config import settings
from app.services.gemini_text_cleanup import clean_gemini_source_text

_ALLOWED_SUFFIXES = {".pdf", ".txt", ".md"}


def assert_allowed_upload(filename: str, size: int) -> str:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in _ALLOWED_SUFFIXES:
        raise HTTPException(
            status_code=400,
            detail="סוג קובץ לא נתמך — PDF, TXT או MD בלבד",
        )
    if size > settings.gemini_source_max_file_bytes:
        raise HTTPException(status_code=400, detail="הקובץ גדול מדי")
    return suffix


def truncate_text(text: str) -> tuple[str, int]:
    cleaned = clean_gemini_source_text(text)
    limit = settings.gemini_source_max_chars_per_file
    if len(cleaned) <= limit:
        return cleaned, len(cleaned)
    note = "\n\n[…הטקסט קוצר בשל מגבלת אורך…]\n\n"
    keep = limit - len(note)
    return cleaned[:keep] + note, limit


def extract_text_from_bytes(data: bytes, suffix: str) -> str:
    if suffix == ".pdf":
        return _extract_pdf(data)
    return data.decode("utf-8", errors="replace")


def _extract_pdf(data: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise HTTPException(status_code=500, detail="חילוץ PDF לא זמין בשרת") from exc
    reader = PdfReader(BytesIO(data))
    parts: list[str] = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    return "\n\n".join(parts)
