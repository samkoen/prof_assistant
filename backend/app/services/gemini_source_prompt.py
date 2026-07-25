from app.models.exam_gemini_source import ExamGeminiSource, ExamGeminiSourceType
from app.services.gemini_text_cleanup import clean_gemini_source_text

_TYPE_LABELS = {
    ExamGeminiSourceType.EXERCISES_FILE: "קובץ תרגילים לדוגמה",
    ExamGeminiSourceType.COURSE_FILE: "קובץ חומר לימוד (מה שהתלמיד למד)",
}

_ROLE_COURSE_CONTENT = (
    "בסיס לחומר שהתלמיד למד — בנו שאלות רק על נושאים מהקובץ הזה "
    "(אלא אם הנחיות המורה מצמצמות לנושא ספציפי)"
)
_ROLE_COURSE_STYLE = (
    "סגנון ניסוח מהחומר — שמרו על שפה ורמת פירוט דומות לחומר הלימוד"
)
_ROLE_EXERCISES_STYLE = (
    "דוגמאות לשאלות — התאימו סגנון, מבנה, ניסוח ורמת קושי לתרגילים בקובץ "
    "(אל תעתיקו שאלות אחד־לאחד; צרו שאלות חדשות באותו אופי)"
)
_ROLE_EXERCISES_CONTENT = (
    "נושאים מהתרגילים לדוגמה — השתמשו בנושאים/כישורים שמופיעים בתרגילים כבסיס לתוכן"
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
        f"### מקור: {src.original_filename} ({label})\n"
        f"תפקיד המקור:\n{role_lines}\n\n"
        f"{clean_gemini_source_text(src.extracted_text)}"
    )


def build_sources_context_block(sources: list[ExamGeminiSource]) -> str:
    if not sources:
        return ""
    sections = [s for src in sources if (s := _section_for_source(src))]
    if not sections:
        return ""
    body = "\n\n---\n\n".join(sections)
    return f"""חומרי מקור מהמורה — חובה לכבד את תפקיד כל מקור:

- קובץ חומר לימוד: זהו בסיס הידע שהתלמיד למד. השאלות חייבות להיות מעוגנות בחומר הזה.
- קובץ תרגילים: אלה דוגמאות לשאלות (סגנון/מבנה/רמה). צרו שאלות חדשות באותו אופי — לא העתקה.

הנחיות המורה מגדירות את המיקוד; המקורות מספקים את הבסיס והדוגמאות.

{body}

---
"""
