"""Tuteur IA : garde-fous, limites, contexte du prompt, notes recopiées, facturation."""

from datetime import datetime, timezone
from types import SimpleNamespace

import pytest

from app.models.enums import QuestionType
from app.services import ai_tutor
from app.services.ai_prompt_store import override_prompt_cache
from app.services.ai_tutor_access import TutorContext, tutor_block_reason
from app.services.ai_tutor_notes import match_notes, normalize_stem, notes_by_stem
from app.services.ai_tutor_prompt import build_contents, build_tutor_context, is_answer_correct
from app.services.billing.context import current_billing
from app.services.exam_questions import answer_signature

NOW = datetime.now(timezone.utc)


def setup_function() -> None:
    override_prompt_cache(None)


def _exam(**kw):
    base = dict(ai_tutor_enabled=True, show_detailed_correction=True, is_tirgoul=False, kind="official",
                title="מבחן", catalog_course=SimpleNamespace(name="מבני נתונים"))
    return SimpleNamespace(**{**base, **kw})


def _attempt(**kw):
    base = dict(id=7, submitted_at=NOW, practice_active=False, practice_submitted_at=None)
    return SimpleNamespace(**{**base, **kw})


def _question(**kw):
    opts = [SimpleNamespace(id=1, text="3", is_correct=False, order_index=0),
            SimpleNamespace(id=2, text="4", is_correct=True, order_index=1)]
    base = dict(id=10, text="כמה זה 2+2?", question_type=QuestionType.SINGLE, options=opts,
                model_answer=None, ai_notes=None)
    return SimpleNamespace(**{**base, **kw})


def _ctx(selected=(1,), **qkw) -> TutorContext:
    return TutorContext(attempt=_attempt(), exam=_exam(), question=_question(**qkw),
                        selected_ids=list(selected), text_answer=None, for_practice=False)


def test_blocked_before_results_are_published():
    session = SimpleNamespace(results_published=False)
    assert tutor_block_reason(_exam(), session, _attempt(), for_practice=False)
    published = SimpleNamespace(results_published=True)
    assert tutor_block_reason(_exam(), published, _attempt(), for_practice=False) is None


def test_blocked_when_teacher_disables_or_not_submitted():
    session = SimpleNamespace(results_published=True)
    assert tutor_block_reason(_exam(ai_tutor_enabled=False), session, _attempt(), for_practice=False)
    assert tutor_block_reason(_exam(), session, _attempt(submitted_at=None), for_practice=False)
    assert tutor_block_reason(_exam(), session, None, for_practice=False)


def test_practice_needs_finished_practice():
    session = SimpleNamespace(results_published=False)
    running = _attempt(practice_active=True, practice_submitted_at=NOW)
    assert tutor_block_reason(_exam(), session, running, for_practice=True)
    done = _attempt(practice_active=False, practice_submitted_at=NOW)
    assert tutor_block_reason(_exam(), session, done, for_practice=True) is None


def test_limits(monkeypatch):
    monkeypatch.setattr(ai_tutor.settings, "ai_tutor_max_messages_per_question", 2)
    monkeypatch.setattr(ai_tutor.settings, "ai_tutor_max_messages_per_exam", 3)
    monkeypatch.setattr(ai_tutor.settings, "ai_tutor_max_message_chars", 5)
    assert ai_tutor.limit_error("abc", 1, 1) is None
    assert ai_tutor.limit_error("abcdef", 0, 0)
    assert ai_tutor.limit_error("abc", 2, 0)
    assert ai_tutor.limit_error("abc", 0, 3)


def test_context_contains_student_answer_and_notes():
    ctx = _ctx(selected=(1,), ai_notes="Generator's worked solution: 2+2=4")
    text = build_tutor_context(ctx)
    assert "מבני נתונים" in text
    assert "Official correct answer: 4" in text
    assert "A) 3" in text and "incorrect" in text
    assert "2+2=4" in text
    assert is_answer_correct(_ctx(selected=(2,))) is True


def test_contents_keep_history_and_append_hint():
    contents = build_contents([("user", "למה?"), ("model", "מה חשבת?")], "תסביר", "step_by_step")
    assert [c["role"] for c in contents] == ["user", "model", "user"]
    assert "step by step" in contents[-1]["parts"][0]["text"]


def test_notes_matched_by_stem_after_reorder():
    raw = "---\nQ1 [single]\nמהו גובה עץ AVL עם 7 צמתים במקרה הטוב?\nA) 2\nB) 3*\n"
    params = {"accumulated_raw": raw, "answer_checks": {"1": {"status": "verified", "solution": "log2(8)=3",
                                                              "reason": "עץ מלא", "checked": ["B"]}}}
    notes = notes_by_stem(params)
    found = match_notes("מהו גובה עץ AVL עם 7 צמתים במקרה הטוב?", notes)
    assert found and "log2(8)=3" in found and "B) 3" in found
    assert match_notes("שאלה אחרת לגמרי", notes) is None
    assert normalize_stem("A) x!") == "ax"


def test_answer_signature_ignores_unchanged_resave():
    a = answer_signature("שאלה", [("3", False), ("4", True)])
    assert a == answer_signature("שאלה", [("4", True), ("3", False)])
    assert a != answer_signature("שאלה", [("3", True), ("4", False)])


@pytest.mark.asyncio
async def test_first_exchange_billed_then_free(monkeypatch):
    seen: list = []

    async def fake_chat(_contents, **_kw):
        seen.append(current_billing())
        return "מה חשבת?"

    monkeypatch.setattr(ai_tutor.ai_client, "generate_chat", fake_chat)
    user = SimpleNamespace(id=3, role="student", ai_explanation_language="he")
    conv = SimpleNamespace(messages=[], charged=False)
    await ai_tutor.ask_tutor_model(_ctx(), conv, user, "למה?", "why_wrong")
    conv.charged = True
    await ai_tutor.ask_tutor_model(_ctx(), conv, user, "ועוד?", None)
    assert seen[0] is not None and seen[0].product == "student_ai"
    assert seen[1] is None
