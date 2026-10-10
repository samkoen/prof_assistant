from dataclasses import dataclass
from pathlib import Path

from app.config import settings
from app.models.exam_gemini_source import ExamGeminiSource, ExamGeminiSourceType
from app.services.ai_attachments import AiAttachment, mime_type_for_suffix
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


def _attachment_for(src: ExamGeminiSource, data: bytes) -> AiAttachment:
    suffix = Path(src.original_filename).suffix
    return AiAttachment(
        filename=src.original_filename,
        mime_type=mime_type_for_suffix(suffix),
        data=data,
        fallback_text=clean_gemini_source_text(src.extracted_text),
    )


def select_attachments(sources: list[ExamGeminiSource]) -> dict[int, AiAttachment]:
    """Sources envoyées en fichier complet, dans la limite du budget de taille d'une requête."""
    chosen: dict[int, AiAttachment] = {}
    used = 0
    for src in sources:
        data = _file_bytes(src) if _roles_for_source(src) else None
        if not data or used + len(data) > settings.gemini_inline_max_total_bytes:
            continue
        chosen[src.id] = _attachment_for(src, data)
        used += len(data)
    return chosen


def _section_for_source(src: ExamGeminiSource, *, attached: bool) -> str | None:
    roles = _roles_for_source(src)
    if not roles:
        return None
    label = _TYPE_LABELS.get(src.source_type, src.source_type)
    role_lines = "\n".join(f"- {r}" for r in roles)
    content = _FILE_ATTACHED_NOTE if attached else clean_gemini_source_text(src.extracted_text)
    return (
        f"### Source: {src.original_filename} ({label})\n"
        f"Role of this source:\n{role_lines}\n\n"
        f"{content}"
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
