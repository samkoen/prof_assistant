from app.models.exam_gemini_source import ExamGeminiSource, ExamGeminiSourceType
from app.services.gemini_text_cleanup import clean_gemini_source_text

_TYPE_LABELS = {
    ExamGeminiSourceType.EXERCISES_FILE: "קובץ תרגילים לדוגמה",
    ExamGeminiSourceType.COURSE_FILE: "קובץ חומר לימוד",
}


def build_sources_context_block(sources: list[ExamGeminiSource]) -> str:
    if not sources:
        return ""
    sections: list[str] = []
    for src in sources:
        roles: list[str] = []
        if src.use_as_style:
            roles.append("סגנון ורמת קושי של השאלות")
        if src.use_as_content:
            roles.append("תוכן ונושאי השאלות")
        if not roles:
            continue
        label = _TYPE_LABELS.get(src.source_type, src.source_type)
        role_text = " + ".join(roles)
        sections.append(
            f"### מקור: {src.original_filename} ({label})\n"
            f"שימוש: {role_text}\n\n"
            f"{clean_gemini_source_text(src.extracted_text)}"
        )
    if not sections:
        return ""
    body = "\n\n---\n\n".join(sections)
    return f"""חומרי מקור מהמורה (התבסס עליהם לפי תפקיד כל מקור):

{body}

---
"""
