from app.models.exam_gemini_source import ExamGeminiSource, ExamGeminiSourceType
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


def _roles_for_source(src: ExamGeminiSource) -> list[str]:
    roles: list[str] = []
    is_course = src.source_type == ExamGeminiSourceType.COURSE_FILE
    if src.use_as_content:
        roles.append(_ROLE_COURSE_CONTENT if is_course else _ROLE_EXERCISES_CONTENT)
    if src.use_as_style:
        roles.append(_ROLE_COURSE_STYLE if is_course else _ROLE_EXERCISES_STYLE)
    return roles


def _section_for_source(src: ExamGeminiSource) -> str | None:
    roles = _roles_for_source(src)
    if not roles:
        return None
    label = _TYPE_LABELS.get(src.source_type, src.source_type)
    role_lines = "\n".join(f"- {r}" for r in roles)
    return (
        f"### Source: {src.original_filename} ({label})\n"
        f"Role of this source:\n{role_lines}\n\n"
        f"{clean_gemini_source_text(src.extracted_text)}"
    )


def build_sources_context_block(sources: list[ExamGeminiSource]) -> str:
    if not sources:
        return ""
    sections = [s for src in sources if (s := _section_for_source(src))]
    if not sections:
        return ""
    body = "\n\n---\n\n".join(sections)
    return render_prompt(get_prompt_body("generation.sources_intro"), {"body": body})
