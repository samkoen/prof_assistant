"""Upload de sources : tout format, fichier brut, texte seulement en repli."""

import pytest
from fastapi import HTTPException

from app.config import settings
from app.services.ai_attachments import mime_type_for_suffix
from app.services.exam_gemini_source_extract import assert_allowed_upload, extract_text_from_bytes


def test_any_suffix_is_allowed():
    assert assert_allowed_upload("notes.xlsx", 10) == ".xlsx"
    assert assert_allowed_upload("photo.PNG", 10) == ".png"
    assert assert_allowed_upload("scan", 10) == ""


def test_empty_and_oversized_are_rejected():
    with pytest.raises(HTTPException) as empty:
        assert_allowed_upload("a.xlsx", 0)
    assert empty.value.status_code == 400
    with pytest.raises(HTTPException) as big:
        assert_allowed_upload("a.pdf", settings.gemini_source_max_file_bytes + 1)
    assert big.value.status_code == 400


def test_binary_is_not_decoded_as_text():
    assert extract_text_from_bytes(b"\xff\xfePK\x03\x04", ".xlsx") == ""
    assert extract_text_from_bytes(b"\x89PNG", ".png") == ""
    assert extract_text_from_bytes(b"hello", ".txt") == "hello"
    assert extract_text_from_bytes(b"not-a-pdf", ".pdf") == ""


def test_mime_types_keep_excel_and_images():
    sheet = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert mime_type_for_suffix(".xlsx") == sheet
    assert mime_type_for_suffix(".XLS") == "application/vnd.ms-excel"
    assert mime_type_for_suffix(".png") == "image/png"
    assert mime_type_for_suffix(".pdf") == "application/pdf"
    assert mime_type_for_suffix(".no-such-type") == "application/octet-stream"
