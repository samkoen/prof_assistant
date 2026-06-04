"""Génération PDF d'un examen — version élève (sans réponses) ou professeur."""

from __future__ import annotations

import re
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from urllib.parse import quote

from fpdf import FPDF
from fpdf.enums import XPos, YPos

from app.models.enums import ExamQuestionsLanguage, QuestionType
from app.models.exam import Exam, Question
from app.services.question_media import local_path_from_image_url, open_image_for_pdf
from app.utils.content_direction import (
    content_dir_for_question_text,
    first_non_empty_line,
    line_html_align_dir,
    prefix_html_align_dir,
    strip_editor_bidi_marks,
)
from app.utils.math_markup import contains_math_markup
from app.utils.mixed_bidi_html import mixed_text_to_html, needs_mixed_html
from app.utils.text_direction import exam_content_is_rtl

FONT_FAMILY = "ExamSans"
_OPTION_LABELS_HE = list("אבגדהוזחט")

COLOR_PRIMARY = (37, 99, 235)
COLOR_PRIMARY_DARK = (29, 78, 216)
COLOR_MUTED = (100, 116, 139)
COLOR_BORDER = (226, 232, 240)
COLOR_CORRECT_BG = (220, 252, 231)
COLOR_CORRECT_TEXT = (21, 128, 61)
COLOR_CORRECT_MARK = (22, 163, 74)

OPTION_ROW_H = 7.5
OPTION_INDENT = 6
QUESTION_IMAGE_MAX_H = 65
OPTION_IMAGE_MAX_H = 45


@dataclass(frozen=True)
class PdfLayout:
    lang: str
    rtl: bool

    @property
    def align(self) -> str:
        return "R" if self.rtl else "L"

    @property
    def html_align(self) -> str:
        return "right" if self.rtl else "left"

    @property
    def html_dir(self) -> str:
        return "rtl" if self.rtl else "ltr"


def _layout_for_exam(exam: Exam, questions: list[Question]) -> PdfLayout:
    rtl = exam_content_is_rtl(questions)
    if rtl:
        lang = ExamQuestionsLanguage.HE
    else:
        raw = (exam.questions_language or ExamQuestionsLanguage.FR).lower()
        lang = raw if raw != ExamQuestionsLanguage.HE else ExamQuestionsLanguage.FR
    return PdfLayout(lang=lang, rtl=rtl)


def _question_type_label(question_type: QuestionType | str, lang: str) -> str:
    he = {
        QuestionType.SINGLE: "בחירה יחידה",
        QuestionType.MULTIPLE: "בחירה מרובה",
        QuestionType.TRUE_FALSE: "נכון / לא נכון",
        "single": "בחירה יחידה",
        "multiple": "בחירה מרובה",
        "true_false": "נכון / לא נכון",
    }
    fr = {
        QuestionType.SINGLE: "Choix unique",
        QuestionType.MULTIPLE: "Choix multiple",
        QuestionType.TRUE_FALSE: "Vrai / faux",
        "single": "Choix unique",
        "multiple": "Choix multiple",
        "true_false": "Vrai / faux",
    }
    en = {
        QuestionType.SINGLE: "Single choice",
        QuestionType.MULTIPLE: "Multiple choice",
        QuestionType.TRUE_FALSE: "True / false",
        "single": "Single choice",
        "multiple": "Multiple choice",
        "true_false": "True / false",
    }
    ru = {
        QuestionType.SINGLE: "Один ответ",
        QuestionType.MULTIPLE: "Несколько ответов",
        QuestionType.TRUE_FALSE: "Верно / неверно",
        "single": "Один ответ",
        "multiple": "Несколько ответов",
        "true_false": "Верно / неверно",
    }
    tables = {"he": he, "fr": fr, "en": en, "ru": ru}
    return tables.get(lang, en).get(question_type, "")


def _cover_strings(layout: PdfLayout, exam: Exam, q_count: int, total_pts: float) -> dict[str, str]:
    if layout.lang == "he":
        return {
            "meta": (
                f"משך: {exam.duration_minutes} דקות  ·  "
                f"שאלות: {q_count}  ·  "
                f"סה״כ נקודות: {total_pts:g}"
            ),
            "teacher": "✓ מסמך למורה — תשובות נכונות מסומנות בירוק",
            "name": "שם: _________________________",
            "id": "ת.ז.: _________________________",
        }
    if layout.lang == "fr":
        return {
            "meta": (
                f"Durée : {exam.duration_minutes} min  ·  "
                f"Questions : {q_count}  ·  "
                f"Total : {total_pts:g} pts"
            ),
            "teacher": "✓ Document enseignant — bonnes réponses en vert",
            "name": "Nom : _________________________",
            "id": "N° : _________________________",
        }
    if layout.lang == "ru":
        return {
            "meta": (
                f"Длительность: {exam.duration_minutes} мин  ·  "
                f"Вопросов: {q_count}  ·  "
                f"Всего баллов: {total_pts:g}"
            ),
            "teacher": "✓ Для преподавателя — верные ответы отмечены зелёным",
            "name": "ФИО: _________________________",
            "id": "ID: _________________________",
        }
    return {
        "meta": (
            f"Duration: {exam.duration_minutes} min  ·  "
            f"Questions: {q_count}  ·  "
            f"Total: {total_pts:g} pts"
        ),
        "teacher": "✓ Teacher copy — correct answers highlighted in green",
        "name": "Name: _________________________",
        "id": "ID: _________________________",
    }


def _points_meta(points: float, q_type: str, layout: PdfLayout) -> str:
    label = _question_type_label(q_type, layout.lang)
    if layout.lang == "he":
        return f"{points:g} נק' · {label}"
    if layout.lang == "fr":
        pt = "pt" if points == 1 else "pts"
        return f"{points:g} {pt} · {label}"
    if layout.lang == "ru":
        return f"{points:g} б. · {label}"
    pt = "pt" if points == 1 else "pts"
    return f"{points:g} {pt} · {label}"


def _option_label(index: int, layout: PdfLayout) -> str:
    if layout.rtl:
        if index < len(_OPTION_LABELS_HE):
            return _OPTION_LABELS_HE[index]
        return str(index + 1)
    return chr(ord("A") + index) if index < 26 else str(index + 1)


def _font_candidates() -> list[Path]:
    root = Path(__file__).resolve().parent.parent
    return [
        root / "assets" / "fonts" / "DejaVuSans.ttf",
        root / "assets" / "fonts" / "SegoeUI.ttf",
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("C:/Windows/Fonts/segoeui.ttf"),
    ]


def _bold_font_candidates(regular: Path) -> list[Path]:
    return [
        regular.parent / "SegoeUI-Bold.ttf",
        regular.parent / "DejaVuSans-Bold.ttf",
        Path("C:/Windows/Fonts/segoeuib.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ]


def _resolve_font_path() -> Path:
    for path in _font_candidates():
        if path.is_file() and path.stat().st_size > 10_000:
            return path
    raise FileNotFoundError("Police Unicode introuvable pour le PDF")


def _resolve_bold_font_path(regular: Path) -> Path:
    for path in _bold_font_candidates(regular):
        if path.is_file() and path.stat().st_size > 10_000:
            return path
    return regular


def _pdf_download_filename(title: str | None, exam_id: int) -> str:
    base = (title or "").strip() or f"exam_{exam_id}"
    base = re.sub(r'[\r\n"/\\]', "", base)[:120]
    if not base.lower().endswith(".pdf"):
        base = f"{base}.pdf"
    return base


def _ascii_filename_fallback(title: str | None, exam_id: int) -> str:
    """Nom ASCII uniquement — en-tête HTTP latin-1 (Starlette)."""
    ascii_title = re.sub(r"[^A-Za-z0-9\s_-]", "", title or "").strip()
    ascii_title = re.sub(r"\s+", "_", ascii_title)[:60]
    base = ascii_title or f"exam_{exam_id}"
    return f"{base}.pdf"


def pdf_content_disposition(exam: Exam) -> str:
    display = _pdf_download_filename(exam.title, exam.id)
    encoded = quote(display, safe="")
    fallback = _ascii_filename_fallback(exam.title, exam.id)
    return f'attachment; filename="{fallback}"; filename*=UTF-8\'\'{encoded}'


def _page_footer_prefix(lang: str) -> str:
    return {"he": "עמוד", "fr": "Page", "en": "Page", "ru": "Стр."}.get(lang, "Page")


class _ExamPdf(FPDF):
    layout: PdfLayout = PdfLayout(lang="he", rtl=True)

    def footer(self) -> None:
        prefix = _page_footer_prefix(self.layout.lang)
        self.set_y(-14)
        self.set_font(FONT_FAMILY, size=9)
        self.set_text_color(*COLOR_MUTED)
        self.cell(0, 8, f"{prefix} {self.page_no()}/{{nb}}", align="C")


def _create_pdf(layout: PdfLayout) -> _ExamPdf:
    pdf = _ExamPdf()
    pdf.layout = layout
    pdf.set_margins(18, 18, 18)
    pdf.set_auto_page_break(auto=True, margin=20)
    regular = _resolve_font_path()
    bold = _resolve_bold_font_path(regular)
    pdf.add_font(FONT_FAMILY, "", str(regular))
    pdf.add_font(FONT_FAMILY, "B", str(bold))
    pdf.alias_nb_pages()
    try:
        pdf.set_text_shaping(True)
    except Exception:
        pass
    return pdf


def _html_indent(indent: float, *, rtl: bool) -> str:
    if not indent:
        return ""
    side = "padding-inline-end" if rtl else "padding-inline-start"
    return f"{side}:{indent}mm;"


def _fpdf_align(html_align: str) -> str:
    return "R" if html_align == "right" else "L"


def _write_html_paragraph(
    pdf: FPDF,
    text: str,
    *,
    html_align: str,
    html_dir: str,
    indent: float,
    wrap_ltr: bool,
) -> None:
    body = mixed_text_to_html(text or "", wrap_ltr=wrap_ltr)
    pad = _html_indent(indent, rtl=html_dir == "rtl")
    pdf.write_html(
        f'<p align="{html_align}" dir="{html_dir}" style="{pad}">{body}</p>'
    )


def _write_text_html(
    pdf: FPDF,
    text: str,
    layout: PdfLayout,
    *,
    indent: float = 0,
    html_align: str | None = None,
    html_dir: str | None = None,
) -> None:
    align = html_align or layout.html_align
    direction = html_dir or layout.html_dir
    _write_html_paragraph(
        pdf,
        text,
        html_align=align,
        html_dir=direction,
        indent=indent,
        wrap_ltr=direction == "rtl",
    )


def _write_text(
    pdf: FPDF,
    text: str,
    layout: PdfLayout,
    *,
    size: int = 11,
    h: float = 7,
    style: str = "",
    color: tuple[int, int, int] = (15, 23, 42),
    indent: float = 0,
    html_align: str | None = None,
    html_dir: str | None = None,
) -> None:
    align = html_align or layout.html_align
    direction = html_dir or layout.html_dir
    pdf.set_font(FONT_FAMILY, style=style, size=size)
    pdf.set_text_color(*color)
    body = text or ""
    if contains_math_markup(body) or needs_mixed_html(body, rtl=direction == "rtl"):
        _write_text_html(
            pdf, body, layout, indent=indent, html_align=align, html_dir=direction
        )
        return
    if indent:
        pdf.set_x(pdf.l_margin + indent)
    pdf.multi_cell(
        w=pdf.epw - indent,
        h=h,
        text=body,
        align=_fpdf_align(align),
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )


def _split_display_lines(text: str) -> list[str]:
    return strip_editor_bidi_marks(text or "").split("\n")


def _write_content_line(
    pdf: FPDF,
    line: str,
    layout: PdfLayout,
    *,
    html_align: str,
    html_dir: str,
    size: int = 11,
    h: float = 7,
    style: str = "",
    color: tuple[int, int, int] = (15, 23, 42),
    indent: float = 0,
) -> None:
    _write_text(
        pdf,
        line,
        layout,
        size=size,
        h=h,
        style=style,
        color=color,
        indent=indent,
        html_align=html_align,
        html_dir=html_dir,
    )


def _write_multiline_content(
    pdf: FPDF,
    text: str,
    layout: PdfLayout,
    *,
    question_rtl: bool,
    size: int = 11,
    h: float = 7,
    style: str = "",
    color: tuple[int, int, int] = (15, 23, 42),
    indent: float = 0,
) -> None:
    for line in _split_display_lines(text):
        html_align, html_dir = line_html_align_dir(line, default_rtl=question_rtl)
        _write_content_line(
            pdf,
            line,
            layout,
            html_align=html_align,
            html_dir=html_dir,
            size=size,
            h=h,
            style=style,
            color=color,
            indent=indent,
        )


def _write_index_line(
    pdf: FPDF,
    index: int,
    question_text: str,
    layout: PdfLayout,
    *,
    question_rtl: bool,
) -> None:
    lines = _split_display_lines(question_text)
    anchor = first_non_empty_line(lines)
    html_align, html_dir = line_html_align_dir(anchor, default_rtl=question_rtl)
    _write_content_line(
        pdf,
        f"{index}.",
        layout,
        html_align=html_align,
        html_dir=html_dir,
        size=11,
        h=7,
        style="B",
        color=(15, 23, 42),
    )


def _draw_header_band(pdf: FPDF) -> None:
    pdf.set_fill_color(*COLOR_PRIMARY)
    pdf.rect(0, 0, pdf.w, 28, style="F")


def _write_cover(
    pdf: FPDF,
    exam: Exam,
    layout: PdfLayout,
    course_name: str,
    question_count: int,
    total_points: float,
    *,
    include_answers: bool,
) -> None:
    strings = _cover_strings(layout, exam, question_count, total_points)
    pdf.add_page()
    _draw_header_band(pdf)
    pdf.set_y(10)
    _write_text(pdf, exam.title, layout, size=20, h=11, style="B", color=(255, 255, 255))
    pdf.ln(10)
    if course_name:
        _write_text(pdf, course_name, layout, size=12, h=7, color=COLOR_PRIMARY_DARK)
    if exam.description:
        pdf.ln(1)
        _write_text(pdf, exam.description, layout, size=10, h=6, color=COLOR_MUTED)
    pdf.ln(4)
    _write_text(pdf, strings["meta"], layout, size=10, h=6, color=COLOR_MUTED)
    if include_answers:
        _write_text(pdf, strings["teacher"], layout, size=9, h=5, color=COLOR_CORRECT_MARK)
    else:
        pdf.ln(2)
        _write_text(pdf, strings["name"], layout, size=11, h=8, color=(15, 23, 42))
        _write_text(pdf, strings["id"], layout, size=11, h=8, color=(15, 23, 42))
    pdf.ln(4)
    pdf.set_draw_color(*COLOR_BORDER)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
    pdf.ln(6)


def _draw_question_border(pdf: FPDF, y0: float, y1: float) -> None:
    pdf.set_draw_color(*COLOR_BORDER)
    pdf.set_line_width(0.3)
    pdf.rect(pdf.l_margin, y0 - 1, pdf.epw, y1 - y0 + 3, style="D")


def _write_embedded_image(
    pdf: FPDF,
    image_url: str | None,
    *,
    indent: float = 0,
    max_height: float = QUESTION_IMAGE_MAX_H,
) -> None:
    path = local_path_from_image_url(image_url)
    if not path:
        return
    source = open_image_for_pdf(path)
    max_w = pdf.epw - indent
    pdf.ln(1)
    pdf.image(
        source,
        x=pdf.l_margin + indent,
        w=max_w,
        h=max_height,
        keep_aspect_ratio=True,
    )
    pdf.ln(2)


def _write_option_line(
    pdf: FPDF,
    layout: PdfLayout,
    label: str,
    text: str,
    image_url: str | None,
    is_correct: bool,
    *,
    include_answers: bool,
    question_rtl: bool,
) -> None:
    y0 = pdf.get_y()
    show_correct = include_answers and is_correct
    lines = _split_display_lines(text)
    est_rows = 1 + max(1, len(lines))
    if show_correct:
        pdf.set_fill_color(*COLOR_CORRECT_BG)
        pdf.rect(pdf.l_margin, y0, pdf.epw, OPTION_ROW_H * est_rows, style="F")
        pdf.set_y(y0)
    mark = " ✓" if show_correct else ""
    color = COLOR_CORRECT_TEXT if show_correct else (51, 65, 85)
    anchor = first_non_empty_line(lines)
    html_align, html_dir = prefix_html_align_dir(anchor, question_rtl=question_rtl)
    _write_content_line(
        pdf,
        f"{label}.{mark}",
        layout,
        html_align=html_align,
        html_dir=html_dir,
        size=10,
        h=OPTION_ROW_H,
        color=color,
        indent=OPTION_INDENT,
    )
    if text.strip():
        _write_multiline_content(
            pdf,
            text,
            layout,
            question_rtl=question_rtl,
            size=10,
            h=OPTION_ROW_H,
            color=color,
            indent=OPTION_INDENT,
        )
    _write_embedded_image(
        pdf,
        image_url,
        indent=OPTION_INDENT + 2,
        max_height=OPTION_IMAGE_MAX_H,
    )


def _write_question(
    pdf: FPDF,
    layout: PdfLayout,
    index: int,
    question: Question,
    *,
    include_answers: bool,
) -> None:
    pdf.ln(3)
    y0 = pdf.get_y()
    q_text = question.text or ""
    question_rtl = content_dir_for_question_text(q_text) == "rtl"
    q_align = "right" if question_rtl else "left"
    q_dir = "rtl" if question_rtl else "ltr"
    _write_text(
        pdf,
        _points_meta(question.points, question.question_type, layout),
        layout,
        size=9,
        h=5,
        color=COLOR_MUTED,
        html_align=q_align,
        html_dir=q_dir,
    )
    pdf.ln(1)
    _write_index_line(pdf, index, q_text, layout, question_rtl=question_rtl)
    if q_text.strip():
        _write_multiline_content(
            pdf,
            q_text,
            layout,
            question_rtl=question_rtl,
            size=11,
            h=7,
            color=(15, 23, 42),
        )
    _write_embedded_image(pdf, question.image_url)
    pdf.ln(1)
    options = sorted(question.options, key=lambda o: o.order_index)
    for i, opt in enumerate(options):
        _write_option_line(
            pdf,
            layout,
            _option_label(i, layout),
            opt.text,
            opt.image_url,
            bool(opt.is_correct),
            include_answers=include_answers,
            question_rtl=question_rtl,
        )
    y1 = pdf.get_y()
    _draw_question_border(pdf, y0, y1)
    pdf.set_y(y1 + 4)


def build_exam_pdf_bytes(
    exam: Exam,
    questions: list[Question],
    course_name: str = "",
    *,
    include_answers: bool = False,
) -> bytes:
    layout = _layout_for_exam(exam, questions)
    ordered = sorted(questions, key=lambda q: (q.order_index, q.id))
    total_points = sum(q.points for q in ordered)
    pdf = _create_pdf(layout)
    _write_cover(
        pdf, exam, layout, course_name, len(ordered), total_points, include_answers=include_answers
    )
    for i, question in enumerate(ordered, start=1):
        _write_question(pdf, layout, i, question, include_answers=include_answers)
    out = BytesIO()
    pdf.output(out)
    return out.getvalue()


def pdf_filename_for_exam(exam: Exam) -> str:
    return _pdf_download_filename(exam.title, exam.id)
