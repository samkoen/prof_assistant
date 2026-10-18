from io import BytesIO
from types import SimpleNamespace

from pypdf import PdfReader

from app.services.task_pdf import build_task_pdf_bytes, layout_for_steps


def _exam():
    return SimpleNamespace(id=7, title="משימת מעבדה", description="הנחיות", questions_language="he")


def _steps():
    return [
        SimpleNamespace(id=2, order_index=1, title="קובץ", instructions="צרף את הדוח", max_points=3),
        SimpleNamespace(id=1, order_index=0, title="צילום", instructions="הראה את המסך", max_points=2),
    ]


def test_task_pdf_is_hebrew_and_lists_steps_in_order():
    exam = _exam()
    assert layout_for_steps(exam, _steps()).rtl is True
    data = build_task_pdf_bytes(exam, _steps(), "מדעי המחשב")
    assert data.startswith(b"%PDF")
    text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(data)).pages)
    assert text.index("הראה את המסך") < text.index("צרף את הדוח")
    assert "צילום מסך" in text
