import logging
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException

from app.config import settings
from app.services.gemini_text_cleanup import clean_gemini_source_text
from app.services.spreadsheet_text import spreadsheet_to_text

logger = logging.getLogger(__name__)

# Repli texte. Excel devient une grille ; images et PDF partent en fichier brut.
_SHEET_SUFFIXES = {".xlsx", ".xlsm"}
_TEXT_SUFFIXES = {
    ".txt", ".md", ".csv", ".json", ".xml", ".html", ".htm",
    ".css", ".js", ".ts", ".rtf", ".log", ".svg",
}


def assert_allowed_upload(filename: str, size: int) -> str:
    """Tout format est accepté ; seule la taille est limitée."""
    if size <= 0:
        raise HTTPException(status_code=400, detail="הקובץ ריק")
    if size > settings.gemini_source_max_file_bytes:
        raise HTTPException(status_code=400, detail="הקובץ גדול מדי")
    return Path(filename or "").suffix.lower()


def truncate_text(text: str) -> tuple[str, int]:
    cleaned = clean_gemini_source_text(text)
    limit = settings.gemini_source_max_chars_per_file
    if len(cleaned) <= limit:
        return cleaned, len(cleaned)
    note = "\n\n[…הטקסט קוצר בשל מגבלת אורך…]\n\n"
    keep = limit - len(note)
    return cleaned[:keep] + note, limit


def extract_text_from_bytes(data: bytes, suffix: str) -> str:
    """Texte de repli. Excel : grille. Image et autre binaire : vide (fichier brut)."""
    if suffix == ".pdf":
        return _extract_pdf(data)
    if suffix in _SHEET_SUFFIXES:
        return spreadsheet_to_text(data)
    if suffix in _TEXT_SUFFIXES:
        return data.decode("utf-8", errors="replace")
    return ""


def _extract_pdf(data: bytes) -> str:
    try:
        return _join_pdf_pages(data)
    except Exception:
        logger.warning("PDF text extraction failed; file will be sent as-is")
        return ""


def _join_pdf_pages(data: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(BytesIO(data))
    return "\n\n".join((page.extract_text() or "") for page in reader.pages)
