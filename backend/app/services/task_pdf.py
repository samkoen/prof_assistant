"""PDF élève d'une משימה : sous-tâches, sans questions ni corrigé."""

from __future__ import annotations

from io import BytesIO

from app.models.exam import Exam
from app.models.task import TaskStep
from app.services.exam_pdf import (
    COLOR_MUTED,
    COLOR_PRIMARY_DARK,
    PdfLayout,
    _create_pdf,
    _draw_header_band,
    _draw_question_border,
    _write_multiline_content,
    _write_text,
)
from app.utils.content_direction import content_dir_for_question_text
from app.utils.text_direction import text_looks_hebrew


def layout_for_steps(exam: Exam, steps: list[TaskStep]) -> PdfLayout:
    sample = "\n".join(f"{step.title}\n{step.instructions}" for step in steps)
    if text_looks_hebrew(sample):
        return PdfLayout(lang="he", rtl=True)
    raw = str(getattr(exam, "questions_language", None) or "fr").lower()
    lang = raw if raw in {"fr", "en", "ru"} else "fr"
    return PdfLayout(lang=lang, rtl=False)


def _ordered(steps: list[TaskStep]) -> list[TaskStep]:
    return sorted(steps, key=lambda step: (step.order_index, step.id))


def _task_meta(layout: PdfLayout, count: int, total: float) -> tuple[str, str]:
    if layout.lang == "he":
        return (
            f"{count} תת-משימות · {total:g} נקודות",
            "לכל תת-משימה יש להעלות צילום מסך או קובץ במערכת",
        )
    if layout.lang == "fr":
        return (
            f"Tâche  ·  sous-tâches : {count}  ·  total : {total:g} pts",
            "Pour chaque sous-tâche, déposez une capture ou un fichier dans l'application",
        )
    return (
        f"Task  ·  sub-tasks: {count}  ·  total: {total:g} pts",
        "For each sub-task, upload a screenshot or a file in the app",
    )


def _identity_lines(layout: PdfLayout) -> tuple[str, str]:
    if layout.lang == "he":
        return "שם: _________________________\u200f", "ת.ז.: _________________________\u200f"
    if layout.lang == "fr":
        return "Nom : _________________________", "N° : _________________________"
    return "Name: _________________________", "ID: _________________________"


def _points_label(points: float, layout: PdfLayout) -> str:
    if layout.lang == "he":
        return f"{points:g} נק'"
    unit = "pt" if points == 1 else "pts"
    return f"{points:g} {unit}"


def _write_task_cover(pdf, exam: Exam, layout: PdfLayout, course_name: str, count: int, total: float) -> None:
    meta, hint = _task_meta(layout, count, total)
    name, student_id = _identity_lines(layout)
    pdf.add_page()
    _draw_header_band(pdf)
    pdf.set_y(10)
    _write_text(pdf, exam.title, layout, size=20, h=11, style="B", color=(255, 255, 255))
    pdf.ln(10)
    if course_name:
        _write_text(pdf, course_name, layout, size=12, h=7, color=COLOR_PRIMARY_DARK)
    if getattr(exam, "description", None):
        pdf.ln(1)
        _write_text(pdf, exam.description, layout, size=10, h=6, color=COLOR_MUTED)
    pdf.ln(4)
    _write_text(pdf, meta, layout, size=10, h=6, color=COLOR_MUTED)
    _write_text(pdf, hint, layout, size=10, h=6, color=COLOR_MUTED)
    pdf.ln(2)
    _write_text(pdf, name, layout, size=11, h=8, color=(15, 23, 42))
    _write_text(pdf, student_id, layout, size=11, h=8, color=(15, 23, 42))
    pdf.ln(6)


def _write_step(pdf, layout: PdfLayout, index: int, step: TaskStep) -> None:
    pdf.ln(3)
    y0 = pdf.get_y()
    rtl = content_dir_for_question_text(f"{step.title}\n{step.instructions}") == "rtl"
    align = "right" if rtl else "left"
    direction = "rtl" if rtl else "ltr"
    _write_text(
        pdf, _points_label(step.max_points, layout), layout,
        size=9, h=5, color=COLOR_MUTED, html_align=align, html_dir=direction,
    )
    pdf.ln(1)
    _write_step_body(pdf, layout, index, step, rtl)
    y1 = pdf.get_y()
    _draw_question_border(pdf, y0, y1)
    pdf.set_y(y1 + 4)


def _write_step_body(pdf, layout: PdfLayout, index: int, step: TaskStep, rtl: bool) -> None:
    align = "right" if rtl else "left"
    direction = "rtl" if rtl else "ltr"
    title = step.title.strip() or "תת-משימה"
    _write_text(
        pdf, f"{index}. {title}", layout, size=12, h=7, style="B", color=(15, 23, 42),
        html_align=align, html_dir=direction,
    )
    if not step.instructions.strip():
        return
    _write_multiline_content(
        pdf, step.instructions, layout, question_rtl=rtl, question_text=step.title,
        size=11, h=7, color=(15, 23, 42),
    )


def build_task_pdf_bytes(exam: Exam, steps: list[TaskStep], course_name: str = "") -> bytes:
    ordered = _ordered(steps)
    layout = layout_for_steps(exam, ordered)
    total = sum(float(step.max_points) for step in ordered)
    pdf = _create_pdf(layout)
    _write_task_cover(pdf, exam, layout, course_name, len(ordered), total)
    for index, step in enumerate(ordered, start=1):
        _write_step(pdf, layout, index, step)
    out = BytesIO()
    pdf.output(out)
    return out.getvalue()
