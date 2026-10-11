"""Fichiers joints à un appel IA (envoyés tels quels à Gemini, texte brut pour les autres fournisseurs)."""

import base64
import mimetypes
from dataclasses import dataclass

from app.services.spreadsheet_text import spreadsheet_to_text

_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
_PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation"

_MIME_BY_SUFFIX = {
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".md": "text/plain",
    ".csv": "text/csv",
    ".json": "application/json",
    ".xml": "text/xml",
    ".html": "text/html",
    ".htm": "text/html",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".svg": "image/svg+xml",
    ".xlsx": _XLSX,
    ".xlsm": "application/vnd.ms-excel.sheet.macroEnabled.12",
    ".xls": "application/vnd.ms-excel",
    ".docx": _DOCX,
    ".doc": "application/msword",
    ".pptx": _PPTX,
    ".ppt": "application/vnd.ms-powerpoint",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
}


@dataclass(frozen=True)
class AiAttachment:
    filename: str
    mime_type: str
    data: bytes
    # Texte extrait : utilisé uniquement si le fournisseur ne sait pas lire le fichier.
    fallback_text: str = ""


_SPREADSHEET_SUFFIXES = {".xlsx", ".xlsm"}


def gemini_inline_payload(data: bytes, suffix: str) -> tuple[bytes, str] | None:
    """Octets envoyés à Gemini. Un xlsx brut provoque un 500 : on envoie la grille texte."""
    if suffix.lower() in _SPREADSHEET_SUFFIXES:
        text = spreadsheet_to_text(data)
        if not text.strip():
            return None
        return text.encode("utf-8"), "text/plain"
    return data, mime_type_for_suffix(suffix)


def mime_type_for_suffix(suffix: str) -> str:
    """MIME réel du fichier. Inconnu → type deviné, sinon octet-stream (fichier inchangé)."""
    key = suffix.lower()
    if key in _MIME_BY_SUFFIX:
        return _MIME_BY_SUFFIX[key]
    guessed, _ = mimetypes.guess_type(f"file{key}")
    return guessed or "application/octet-stream"


def gemini_parts(attachments: list[AiAttachment]) -> list[dict]:
    """Parts `inlineData` de l'API Gemini (fichier complet, encodé en base64)."""
    return [
        {"inlineData": {"mimeType": a.mime_type, "data": base64.b64encode(a.data).decode("ascii")}}
        for a in attachments
    ]


def text_fallback_block(attachments: list[AiAttachment]) -> str:
    """Contenu texte des fichiers, pour un fournisseur sans lecture de fichiers."""
    sections = [f"### File: {a.filename}\n{a.fallback_text}" for a in attachments if a.fallback_text.strip()]
    if not sections:
        return ""
    return "Attached files (text content):\n\n" + "\n\n---\n\n".join(sections) + "\n\n"
