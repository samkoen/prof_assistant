from dataclasses import dataclass
from pathlib import Path

from app.config import settings
from app.models.exam_gemini_source import ExamGeminiSource, ExamGeminiSourceType
from app.services.ai_attachments import AiAttachment, gemini_inline_payload
from app.services.ai_prompt_render import render_prompt
from app.services.ai_prompt_store import get_prompt_body
from app.services.gemini_text_cleanup import clean_gemini_source_text

_TYPE_LABELS = {
    ExamGeminiSourceType.EXERCISES_FILE: "sample exercises file",
    ExamGeminiSourceType.COURSE_FILE: "course-material file (what the student learned)",
}

_ROLE_COURSE_CONTENT = (
    "Knowledge base of what the student learned — build questions only on topics from this file "
    "(unless the teacher instructions narrow the topic)"
)
_ROLE_COURSE_STYLE = (
    "Wording style from the material — keep similar language and level of detail"
)
_ROLE_EXERCISES_STYLE = (
    "Sample questions — match style, structure, wording and difficulty of the exercises in the file "
    "(do not copy questions one-to-one; create new questions of the same kind)"
)
_ROLE_EXERCISES_CONTENT = (
    "Topics from the sample exercises — use the topics/skills in the exercises as the content base"
)
_FILE_ATTACHED_NOTE = "The complete original file is attached to this message — read it in full."
_SHEET_ATTACHED_NOTE = (
    "The spreadsheet is attached as plain text: one line per row, cells separated by ' | '. "
    "Blank lines are real empty rows. Read every row in order — data rows and question rows "
    "may follow each other on the same sheet."
)
_SHEET_SUFFIXES = {".xlsx", ".xlsm"}
_FILE_NOT_INLINED_NOTE = (
    "The original file is not attached (size budget) and no text extract is available."
)


@dataclass(frozen=True)
class SourcesPackage:
    """Bloc de contexte pour le prompt + fichiers complets à joindre à l'appel IA."""

    block: str
    attachments: list[AiAttachment]


def _roles_for_source(src: ExamGeminiSource) -> list[str]:
    roles: list[str] = []
    is_course = src.source_type == ExamGeminiSourceType.COURSE_FILE
    if src.use_as_content:
        roles.append(_ROLE_COURSE_CONTENT if is_course else _ROLE_EXERCISES_CONTENT)
    if src.use_as_style:
        roles.append(_ROLE_COURSE_STYLE if is_course else _ROLE_EXERCISES_STYLE)
    return roles


def _file_bytes(src: ExamGeminiSource) -> bytes | None:
    """Fichier d'origine : base de données d'abord, sinon ancien stockage disque (sources déjà envoyées)."""
    if src.file_data:
        return bytes(src.file_data)
    path = Path(src.storage_path)
    if src.storage_path.startswith("ephemeral://") or not path.is_file():
        return None
    return path.read_bytes()


def _fallback_text(src: ExamGeminiSource, payload: bytes, mime: str) -> str:
    text = clean_gemini_source_text(src.extracted_text)
    if text or mime != "text/plain":
        return text
    return payload.decode("utf-8", errors="replace")


def _attachment_for(src: ExamGeminiSource, data: bytes) -> AiAttachment | None:
    suffix = Path(src.original_filename).suffix
    payload = gemini_inline_payload(data, suffix)
    if payload is None:
        return None
    raw, mime = payload
    return AiAttachment(
        filename=src.original_filename,
        mime_type=mime,
        data=raw,
        fallback_text=_fallback_text(src, raw, mime),
    )


def _within_budget(used: int, size: int) -> bool:
    return used + size <= settings.gemini_inline_max_total_bytes


def select_attachments(sources: list[ExamGeminiSource]) -> dict[int, AiAttachment]:
    """Sources envoyées en fichier complet, dans la limite du budget de taille d'une requête."""
    chosen: dict[int, AiAttachment] = {}
    used = 0
    for src in sources:
        data = _file_bytes(src) if _roles_for_source(src) else None
        attachment = _attachment_for(src, data) if data else None
        if attachment is None or not _within_budget(used, len(attachment.data)):
            continue
        chosen[src.id] = attachment
        used += len(attachment.data)
    return chosen


def _attached_note(src: ExamGeminiSource) -> str:
    if Path(src.original_filename).suffix.lower() in _SHEET_SUFFIXES:
        return _SHEET_ATTACHED_NOTE
    return _FILE_ATTACHED_NOTE


def _body_for_source(src: ExamGeminiSource, *, attached: bool) -> str:
    if attached:
        return _attached_note(src)
    text = clean_gemini_source_text(src.extracted_text)
    return text or _FILE_NOT_INLINED_NOTE


def _section_for_source(src: ExamGeminiSource, *, attached: bool) -> str | None:
    roles = _roles_for_source(src)
    if not roles:
        return None
    label = _TYPE_LABELS.get(src.source_type, src.source_type)
    role_lines = "\n".join(f"- {r}" for r in roles)
    return (
        f"### Source: {src.original_filename} ({label})\n"
        f"Role of this source:\n{role_lines}\n\n"
        f"{_body_for_source(src, attached=attached)}"
    )


def build_sources_package(sources: list[ExamGeminiSource]) -> SourcesPackage:
    """Fichier complet joint quand c'est possible ; sinon texte extrait dans le prompt."""
    if not sources:
        return SourcesPackage("", [])
    attached = select_attachments(sources)
    sections = [s for src in sources if (s := _section_for_source(src, attached=src.id in attached))]
    if not sections:
        return SourcesPackage("", [])
    body = "\n\n---\n\n".join(sections)
    block = render_prompt(get_prompt_body("generation.sources_intro"), {"body": body})
    return SourcesPackage(block, list(attached.values()))
