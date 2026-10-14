from types import SimpleNamespace

import pytest

from app.models.enums import UserRole
from app.services import gemini_question_generation as generation
from app.services.billing.constants import STUDENT_AI, TEACHER_GENERATION
from app.services.billing.context import current_billing


def _stub_generation(monkeypatch, seen: dict):
    monkeypatch.setattr(generation, "build_questions_generation_prompt", lambda series, title: "p")

    async def fake_generate(_prompt, *, for_generation=False):
        seen["billing"] = current_billing()
        return "ok"

    monkeypatch.setattr(generation, "generate_text", fake_generate)


@pytest.mark.asyncio
async def test_student_draft_bills_student_wallet(monkeypatch):
    seen: dict = {}
    _stub_generation(monkeypatch, seen)
    user = SimpleNamespace(id=4, role=UserRole.STUDENT)
    assert await generation.generate_exam_questions_text([], user=user) == "ok"
    assert seen["billing"].product == STUDENT_AI


@pytest.mark.asyncio
async def test_teacher_draft_bills_teacher_wallet(monkeypatch):
    seen: dict = {}
    _stub_generation(monkeypatch, seen)
    user = SimpleNamespace(id=2, role=UserRole.TEACHER)
    await generation.generate_exam_questions_text([], user=user)
    assert seen["billing"].product == TEACHER_GENERATION
