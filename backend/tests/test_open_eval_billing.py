from types import SimpleNamespace

import pytest

from app.services import open_answer_evaluation as oae
from app.services.billing.constants import STUDENT_AI
from app.services.billing.context import bill_ai, current_billing, unbilled

STUDENT = SimpleNamespace(id=1, role="student")
QUESTION = SimpleNamespace(text="?", points=2.0, model_answer=None)


def _record_calls(monkeypatch, seen: list):
    async def fake_eval_once(_q, _text, _lang, *, strict=False):
        seen.append((strict, current_billing()))
        return ("transliteration" if not strict else "טוב", 1.0, None)

    monkeypatch.setattr(oae, "_eval_once", fake_eval_once)
    monkeypatch.setattr(oae, "looks_latin_transliteration", lambda text: text == "transliteration")


@pytest.mark.asyncio
async def test_hebrew_retry_is_not_billed(monkeypatch):
    seen: list = []
    _record_calls(monkeypatch, seen)
    async with bill_ai(STUDENT, STUDENT_AI):
        result = await oae._run_ai_evaluation(QUESTION, "תשובה", "he")
    assert result[0] == "טוב"
    first, retry = seen
    assert first[0] is False and first[1] is not None  # premier appel : facturé
    assert retry[0] is True and retry[1] is None  # relance stricte : gratuite


@pytest.mark.asyncio
async def test_billing_context_is_restored_after_unbilled():
    async with bill_ai(STUDENT, STUDENT_AI):
        async with unbilled():
            assert current_billing() is None
        assert current_billing() is not None
    assert current_billing() is None
