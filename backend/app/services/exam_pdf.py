"""Génération PDF d'un examen — version élève (sans réponses) ou professeur."""

from __future__ import annotations

import re
from io import BytesIO
from pathlib import Path
from urllib.parse import quote

from fpdf import FPDF
from fpdf.enums import XPos, YPos

from app.models.enums import QuestionType
from app.models.exam import Exam, Question
from app.utils.math_markup import contains_math_markup, markup_to_html

FONT_FAMILY = "ExamSans"
_OPTION_LABELS = list("אבגדהוזחט")

COLOR_PRIMARY = (37, 99, 235)
COLOR_PRIMARY_DARK = (29, 78, 216)
COLOR_MUTED = (100, 116, 139)
COLOR_BORDER = (226, 232, 240)
COLOR_CORRECT_BG = (220, 252, 231)
COLOR_CORRECT_TEXT = (21, 128, 61)
COLOR_CORRECT_MARK = (22, 163, 74)


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


def _ascii_filename(exam_id: int, title: str = "") -> str:
    ascii_title = re.sub(r"[^A-Za-z0-9\s_-]", "", title).strip()
    ascii_title = re.sub(r"\s+", "_", ascii_title)[:60]
    base = ascii_title or f"exam_{exam_id}"
    return f"{base}.pdf"


def pdf_content_disposition(exam: Exam) -> str:
    fallback = _ascii_filename(exam.id, exam.title)
    display = (exam.title or fallback.removesuffix(".pdf")).strip()
    display = re.sub(r'[\r\n"]', "", display)[:120] or fallback.removesuffix(".pdf")
    encoded = quote(f"{display}.pdf", safe="")
    return f"attachment; filename=\"{fallback}\"; filename*=UTF-8''{encoded}"


class _ExamPdf(FPDF):
    def footer(self) -> None:
        self.set_y(-14)
        self.set_font(FONT_FAMILY, size=9)
        self.set_text_color(*COLOR_MUTED)
        self.cell(0, 8, f"עמוד {self.page_no()}/{{nb}}", align="C")


def _create_pdf() -> _ExamPdf:
    pdf = _ExamPdf()
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


def _write_rtl_html(pdf: FPDF, text: str, *, indent: float = 0) -> None:
    body = markup_to_html(text or "")
    pad = f"padding-inline-end:{indent}mm;" if indent else ""
    pdf.write_html(f'<p align="right" dir="rtl" style="{pad}">{body}</p>')


def _write_rtl(
    pdf: FPDF,
    text: str,
    *,
    size: int = 11,
    h: float = 7,
    style: str = "",
    color: tuple[int, int, int] = (15, 23, 42),
    indent: float = 0,
) -> None:
    pdf.set_font(FONT_FAMILY, style=style, size=size)
    pdf.set_text_color(*color)
    if contains_math_markup(text or ""):
        _write_rtl_html(pdf, text, indent=indent)
        return
    if indent:
        pdf.set_x(pdf.l_margin + indent)
    pdf.multi_cell(
        w=pdf.epw - indent,
        h=h,
        text=text or "",
        align="R",
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )


def _draw_header_band(pdf: FPDF) -> None:
    pdf.set_fill_color(*COLOR_PRIMARY)
    pdf.rect(0, 0, pdf.w, 28, style="F")


def _write_cover(
    pdf: FPDF,
    exam: Exam,
    course_name: str,
    question_count: int,
    total_points: float,
    *,
    include_answers: bool,
) -> None:
    pdf.add_page()
    _draw_header_band(pdf)
    pdf.set_y(10)
    _write_rtl(pdf, exam.title, size=20, h=11, style="B", color=(255, 255, 255))
    pdf.ln(10)
    if course_name:
        _write_rtl(pdf, course_name, size=12, h=7, color=COLOR_PRIMARY_DARK)
    if exam.description:
        pdf.ln(1)
        _write_rtl(pdf, exam.description, size=10, h=6, color=COLOR_MUTED)
    pdf.ln(4)
    meta = (
        f"משך: {exam.duration_minutes} דקות  ·  "
        f"שאלות: {question_count}  ·  "
        f"סה״כ נקודות: {total_points:g}"
    )
    _write_rtl(pdf, meta, size=10, h=6, color=COLOR_MUTED)
    if include_answers:
        _write_rtl(
            pdf,
            "✓ מסמך למורה — תשובות נכונות מסומנות בירוק",
            size=9,
            h=5,
            color=COLOR_CORRECT_MARK,
        )
    else:
        pdf.ln(2)
        _write_rtl(pdf, "שם: _________________________", size=11, h=8, color=(15, 23, 42))
        _write_rtl(pdf, "ת.ז.: _________________________", size=11, h=8, color=(15, 23, 42))
    pdf.ln(4)
    pdf.set_draw_color(*COLOR_BORDER)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
    pdf.ln(6)


def _question_type_label(question_type: QuestionType | str) -> str:
    mapping = {
        QuestionType.SINGLE: "בחירה יחידה",
        QuestionType.MULTIPLE: "בחירה מרובה",
        QuestionType.TRUE_FALSE: "נכון / לא נכון",
        "single": "בחירה יחידה",
        "multiple": "בחירה מרובה",
        "true_false": "נכון / לא נכון",
    }
    return mapping.get(question_type, "")


def _option_letter(index: int) -> str:
    if index < len(_OPTION_LABELS):
        return _OPTION_LABELS[index]
    return str(index + 1)


OPTION_ROW_H = 7.5
OPTION_INDENT = 6


def _draw_question_border(pdf: FPDF, y0: float, y1: float) -> None:
    pdf.set_draw_color(*COLOR_BORDER)
    pdf.set_line_width(0.3)
    pdf.rect(pdf.l_margin, y0 - 1, pdf.epw, y1 - y0 + 3, style="D")


def _write_option_line(
    pdf: FPDF,
    label: str,
    text: str,
    is_correct: bool,
    *,
    include_answers: bool,
) -> None:
    y0 = pdf.get_y()
    show_correct = include_answers and is_correct
    if show_correct:
        pdf.set_fill_color(*COLOR_CORRECT_BG)
        pdf.rect(pdf.l_margin, y0, pdf.epw, OPTION_ROW_H, style="F")
        pdf.set_y(y0)
    mark = " ✓" if show_correct else ""
    color = COLOR_CORRECT_TEXT if show_correct else (51, 65, 85)
    _write_rtl(
        pdf,
        f"{label}. {text}{mark}",
        size=10,
        h=OPTION_ROW_H,
        color=color,
        indent=OPTION_INDENT,
    )


def _write_question(pdf: FPDF, index: int, question: Question, *, include_answers: bool) -> None:
    pdf.ln(3)
    y0 = pdf.get_y()
    badge = f"שאלה {index}"
    meta = f"{question.points:g} נק' · {_question_type_label(question.question_type)}"
    _write_rtl(pdf, badge, size=12, h=8, style="B", color=COLOR_PRIMARY_DARK)
    _write_rtl(pdf, meta, size=9, h=5, color=COLOR_MUTED)
    pdf.ln(1)
    _write_rtl(pdf, question.text, size=11, h=7, color=(15, 23, 42))
    pdf.ln(1)
    options = sorted(question.options, key=lambda o: o.order_index)
    for i, opt in enumerate(options):
        _write_option_line(
            pdf,
            _option_letter(i),
            opt.text,
            bool(opt.is_correct),
            include_answers=include_answers,
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
    ordered = sorted(questions, key=lambda q: (q.order_index, q.id))
    total_points = sum(q.points for q in ordered)
    pdf = _create_pdf()
    _write_cover(pdf, exam, course_name, len(ordered), total_points, include_answers=include_answers)
    for i, question in enumerate(ordered, start=1):
        _write_question(pdf, i, question, include_answers=include_answers)
    out = BytesIO()
    pdf.output(out)
    return out.getvalue()


def pdf_filename_for_exam(exam: Exam) -> str:
    return _ascii_filename(exam.id, exam.title)
