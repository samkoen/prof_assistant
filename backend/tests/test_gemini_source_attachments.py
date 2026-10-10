"""Sources IA : fichier complet joint à l'appel, texte extrait seulement en repli."""

import base64
from types import SimpleNamespace

from app.config import settings
from app.models.exam_gemini_source import ExamGeminiSourceType
from app.services.ai_attachments import AiAttachment, gemini_parts, text_fallback_block
from app.services.ai_client import contents_with_attachment_text, prompt_with_attachment_text
from app.services.gemini_client import with_attachments
from app.services.gemini_source_prompt import build_sources_package


def _src(sid: int, data: bytes | None, *, name="cours.pdf", text="תוכן", content=True, style=False):
    return SimpleNamespace(
        id=sid,
        original_filename=name,
        source_type=ExamGeminiSourceType.COURSE_FILE,
        storage_path=f"ephemeral://1/{name}",
        file_data=data,
        extracted_text=text,
        use_as_content=content,
        use_as_style=style,
    )


def test_attached_file_is_not_repeated_as_truncated_text():
    package = build_sources_package([_src(1, b"%PDF-data", text="TRUNCATED-TEXT")])
    assert len(package.attachments) == 1
    assert package.attachments[0].data == b"%PDF-data"
    assert package.attachments[0].mime_type == "application/pdf"
    assert "TRUNCATED-TEXT" not in package.block
    assert "cours.pdf" in package.block and "attached" in package.block


def test_exercises_file_is_attached_too():
    src = _src(1, b"Q1 ...", name="exercices.txt", text="TRUNCATED", content=False, style=True)
    src.source_type = ExamGeminiSourceType.EXERCISES_FILE
    package = build_sources_package([src])
    assert [a.filename for a in package.attachments] == ["exercices.txt"]
    assert package.attachments[0].mime_type == "text/plain"
    assert "TRUNCATED" not in package.block and "sample exercises file" in package.block


def test_source_without_file_falls_back_to_text():
    package = build_sources_package([_src(1, None, text="FULL-FALLBACK")])
    assert package.attachments == []
    assert "FULL-FALLBACK" in package.block


def test_inline_budget_keeps_overflowing_file_as_text(monkeypatch):
    monkeypatch.setattr(settings, "gemini_inline_max_total_bytes", 10)
    package = build_sources_package([_src(1, b"12345678", name="a.pdf"), _src(2, b"12345678", name="b.pdf", text="B-TEXT")])
    assert [a.filename for a in package.attachments] == ["a.pdf"]
    assert "B-TEXT" in package.block


def test_source_without_role_is_ignored():
    package = build_sources_package([_src(1, b"x", content=False, style=False)])
    assert package.attachments == [] and package.block == ""


def test_gemini_parts_are_base64_inline_data():
    parts = gemini_parts([AiAttachment("a.txt", "text/plain", b"hello")])
    assert parts == [{"inlineData": {"mimeType": "text/plain", "data": base64.b64encode(b"hello").decode()}}]


def test_with_attachments_prepends_files_to_first_user_message():
    contents = [{"role": "user", "parts": [{"text": "q"}]}, {"role": "model", "parts": [{"text": "a"}]}]
    out = with_attachments(contents, [AiAttachment("a.txt", "text/plain", b"x")])
    assert "inlineData" in out[0]["parts"][0] and out[0]["parts"][1] == {"text": "q"}
    assert contents[0]["parts"] == [{"text": "q"}]  # entrée non modifiée


def test_other_providers_receive_the_extracted_text():
    att = [AiAttachment("a.pdf", "application/pdf", b"x", fallback_text="HELLO")]
    assert "HELLO" in prompt_with_attachment_text("prompt", att)
    assert prompt_with_attachment_text("prompt", None) == "prompt"
    chat = contents_with_attachment_text([{"role": "user", "parts": [{"text": "q"}]}], att)
    assert "HELLO" in chat[0]["parts"][0]["text"]


def test_text_fallback_block_skips_empty_text():
    assert text_fallback_block([AiAttachment("a.pdf", "application/pdf", b"x", fallback_text="  ")]) == ""
