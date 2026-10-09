"""Crédits IA : quota, cache, release, tranche prof, webhook PayMe."""

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.config import settings
from app.models.billing import AiUsage, AiWallet, PaymentOrder
from app.models.course import CourseCatalog, CourseEnrollment, CourseOffering
from app.models.enums import EnrollmentStatus, UserRole
from app.models.exam import (
    Answer,
    Exam,
    ExamSession,
    Question,
    QuestionAiExplanation,
    QuestionOption,
    StudentExamAttempt,
)
from app.models.user import User
from app.services.ai_client import AiError, generate_text
from app.services.ai_explanation import explain_exam_question, regenerate_exam_question_explanation
from app.services.billing.checkout import apply_webhook, start_checkout
from app.services.billing.constants import (
    CALLS_PER_TEACHER_CREDIT,
    STUDENT_AI,
    STUDENT_FREE_CREDITS,
    TEACHER_FREE_CREDITS,
    TEACHER_GENERATION,
)
from app.services.billing.context import bill_ai
from app.services.billing.packs import PACKS
from app.services.billing.payme import payme_signature
from app.services.billing.payme_client import sale_endpoint, sale_headers
from app.services.billing.settings_store import (
    config_payload,
    default_config,
    save_billing_settings,
    settings_from_payload,
)
from app.services.billing.wallet import lock_wallet
from tests.integration.conftest import open_sqlite_maker


def _user(role: str, user_id: int = 1):
    return SimpleNamespace(id=user_id, role=role)


async def _free(maker, user_id: int, product: str) -> int:
    async with maker() as db:
        stmt = select(AiWallet).where(AiWallet.user_id == user_id, AiWallet.product == product)
        wallet = (await db.execute(stmt)).scalar_one()
        return wallet.free_remaining


async def _bind(monkeypatch):
    _engine, maker = await open_sqlite_maker()
    monkeypatch.setattr("app.database.async_session_maker", maker)
    return maker


@pytest.mark.asyncio
async def test_pack_prices_match_the_plan():
    assert PACKS["student_20"].price_ils == 19
    assert PACKS["student_60"].price_ils == 45
    assert PACKS["teacher_5"].price_ils == 29
    assert PACKS["teacher_15"].price_ils == 69
    assert CALLS_PER_TEACHER_CREDIT == 5
    assert STUDENT_FREE_CREDITS == 5
    assert TEACHER_FREE_CREDITS == 3


@pytest.mark.asyncio
async def test_student_sixth_call_is_402_without_model(monkeypatch):
    maker = await _bind(monkeypatch)
    calls = {"n": 0}

    async def _ok(*_a, **_k):
        calls["n"] += 1
        return "ok"

    monkeypatch.setattr("app.services.ai_client._run_text", _ok)
    user = _user("student", 4)
    async with bill_ai(user, STUDENT_AI):
        for _ in range(5):
            assert await generate_text("q") == "ok"
    assert calls["n"] == 5
    assert await _free(maker, 4, STUDENT_AI) == 0
    with pytest.raises(HTTPException) as exc:
        async with bill_ai(user, STUDENT_AI):
            await generate_text("again")
    assert exc.value.status_code == 402
    assert calls["n"] == 5


@pytest.mark.asyncio
async def test_model_error_returns_the_credit(monkeypatch):
    maker = await _bind(monkeypatch)

    async def _boom(*_a, **_k):
        raise AiError("timeout")

    monkeypatch.setattr("app.services.ai_client._run_text", _boom)
    user = _user("student", 8)
    with pytest.raises(AiError):
        async with bill_ai(user, STUDENT_AI):
            await generate_text("q")
    assert await _free(maker, 8, STUDENT_AI) == STUDENT_FREE_CREDITS


@pytest.mark.asyncio
async def test_teacher_sixth_call_opens_a_second_credit(monkeypatch):
    maker = await _bind(monkeypatch)

    async def _ok(*_a, **_k):
        return "qcm"

    monkeypatch.setattr("app.services.ai_client._run_text", _ok)
    user = _user("teacher", 3)
    async with bill_ai(user, TEACHER_GENERATION, 11):
        for _ in range(6):
            await generate_text("batch", for_generation=True)
    assert await _free(maker, 3, TEACHER_GENERATION) == TEACHER_FREE_CREDITS - 2
    async with maker() as db:
        rows = (
            await db.execute(select(AiUsage).where(AiUsage.user_id == 3).order_by(AiUsage.id))
        ).scalars().all()
    assert [row.slots_used for row in rows] == [5, 1]


@pytest.mark.asyncio
async def test_admin_is_not_charged(monkeypatch):
    maker = await _bind(monkeypatch)

    async def _ok(*_a, **_k):
        return "ok"

    monkeypatch.setattr("app.services.ai_client._run_text", _ok)
    async with bill_ai(_user("admin", 1), STUDENT_AI):
        await generate_text("q")
    async with maker() as db:
        rows = (await db.execute(select(AiWallet))).scalars().all()
    assert rows == []


def _completed_payload() -> dict:
    payload = {
        "transaction_id": "txn-once",
        "payme_sale_id": "SALE1",
        "sale_status": "completed",
        "price": "1900",
    }
    payload["payme_signature"] = payme_signature("sek", "txn-once", "SALE1", "completed")
    return payload


async def _pending_order(maker) -> None:
    async with maker() as db:
        db.add(
            PaymentOrder(
                user_id=9,
                pack_code="student_20",
                product=STUDENT_AI,
                credits=20,
                amount_agorot=1900,
                status="pending",
                transaction_id="txn-once",
            )
        )
        await db.commit()


@pytest.mark.asyncio
async def test_webhook_credits_once(monkeypatch):
    maker = await _bind(monkeypatch)
    monkeypatch.setattr(settings, "payme_webhook_secret", "sek", raising=False)
    await _pending_order(maker)
    payload = _completed_payload()
    async with maker() as db:
        assert await apply_webhook(payload, db) == "paid"
    async with maker() as db:
        assert await apply_webhook(payload, db) == "already_paid"
        wallet = (await db.execute(select(AiWallet).where(AiWallet.user_id == 9))).scalar_one()
    assert wallet.paid_remaining == 20
    assert wallet.free_remaining == STUDENT_FREE_CREDITS


@pytest.mark.asyncio
async def test_unsigned_webhook_credits_when_payme_sale_is_completed(monkeypatch):
    maker = await _bind(monkeypatch)
    monkeypatch.setattr(settings, "payme_webhook_secret", "sek", raising=False)

    async def _paid(_transaction_id: str) -> dict:
        return {"sale_status": "completed", "sale_price": 1900, "sale_payme_id": "SALE9"}

    monkeypatch.setattr("app.services.billing.checkout.fetch_sale", _paid)
    await _pending_order(maker)
    async with maker() as db:
        result = await apply_webhook({"transaction_id": "txn-once", "payme_signature": "nope"}, db)
        wallet = (await db.execute(select(AiWallet).where(AiWallet.user_id == 9))).scalar_one()
    assert result == "paid"
    assert wallet.paid_remaining == 20


@pytest.mark.asyncio
async def test_unsigned_webhook_rejects_an_open_sale(monkeypatch):
    maker = await _bind(monkeypatch)
    monkeypatch.setattr(settings, "payme_webhook_secret", "sek", raising=False)

    async def _open(_transaction_id: str) -> dict:
        return {"sale_status": "initial", "sale_price": 1900}

    monkeypatch.setattr("app.services.billing.checkout.fetch_sale", _open)
    await _pending_order(maker)
    async with maker() as db:
        with pytest.raises(HTTPException) as exc:
            await apply_webhook({"transaction_id": "txn-once", "payme_signature": "nope"}, db)
        order = (await db.execute(select(PaymentOrder))).scalar_one()
    assert exc.value.status_code == 401
    assert order.status == "pending"


@pytest.mark.asyncio
async def test_checkout_without_payme_key_does_not_credit(monkeypatch):
    maker = await _bind(monkeypatch)
    monkeypatch.setattr(settings, "payme_seller_id", "", raising=False)
    monkeypatch.setattr(settings, "payme_api_key", "", raising=False)
    user = User(email="s@example.com", password_hash="x", full_name="S", role=UserRole.STUDENT)
    async with maker() as db:
        db.add(user)
        await db.commit()
        await db.refresh(user)
        with pytest.raises(HTTPException) as exc:
            await start_checkout(user, "student_20", db)
        assert exc.value.status_code == 503
        orders = (await db.execute(select(PaymentOrder))).scalars().all()
    assert orders == []


def _offering(catalog_id: int, teacher_id: int) -> CourseOffering:
    return CourseOffering(
        catalog_course_id=catalog_id,
        teacher_id=teacher_id,
        group_name="א",
        academic_year=2026,
        semester=1,
        join_token="join-bill-1",
        join_token_expires_at=datetime.now(timezone.utc) + timedelta(days=1),
    )


async def _seed_users(db):
    teacher = User(email="t@example.com", password_hash="x", full_name="T", role=UserRole.TEACHER)
    student = User(
        email="st@example.com",
        password_hash="x",
        full_name="S",
        role=UserRole.STUDENT,
        ai_explanation_language="he",
    )
    db.add_all([teacher, student])
    await db.flush()
    return teacher, student


async def _seed_exam(db, teacher_id: int, student_id: int):
    catalog = CourseCatalog(name="מתמטיקה", teacher_id=teacher_id)
    db.add(catalog)
    await db.flush()
    offering = _offering(catalog.id, teacher_id)
    db.add(offering)
    await db.flush()
    db.add(
        CourseEnrollment(
            offering_id=offering.id, student_id=student_id, status=EnrollmentStatus.APPROVED
        )
    )
    exam = Exam(
        catalog_course_id=catalog.id,
        created_by_id=teacher_id,
        title="בוחן",
        shuffle_questions=False,
        shuffle_options=False,
        show_detailed_correction=True,
    )
    db.add(exam)
    await db.flush()
    session = ExamSession(exam_id=exam.id, offering_id=offering.id, results_published=True)
    db.add(session)
    await db.flush()
    return session


async def _seed_cached_explanation(maker):
    async with maker() as db:
        teacher, student = await _seed_users(db)
        session = await _seed_exam(db, teacher.id, student.id)
        question = Question(exam_id=session.exam_id, text="כמה זה 2+2?", question_type="single", points=1)
        db.add(question)
        await db.flush()
        option = QuestionOption(question_id=question.id, text="4", is_correct=True, order_index=0)
        attempt = StudentExamAttempt(
            exam_session_id=session.id,
            student_id=student.id,
            submitted_at=datetime.now(timezone.utc),
        )
        db.add_all([option, attempt])
        await db.flush()
        db.add(Answer(attempt_id=attempt.id, question_id=question.id, selected_option_ids=[option.id]))
        db.add(
            QuestionAiExplanation(
                attempt_id=attempt.id,
                question_id=question.id,
                language="he",
                for_practice=False,
                explanation="מהמטמון",
            )
        )
        await db.commit()
        return student.id, session.id, question.id


@pytest.mark.asyncio
async def test_cached_explanation_is_free_and_regenerate_costs_one(monkeypatch):
    maker = await _bind(monkeypatch)
    student_id, session_id, question_id = await _seed_cached_explanation(maker)
    calls = {"n": 0}

    async def _ok(*_a, **_k):
        calls["n"] += 1
        return "הסבר חדש"

    monkeypatch.setattr("app.services.ai_client._run_text", _ok)
    async with maker() as db:
        student = await db.get(User, student_id)
        text, from_cache = await explain_exam_question(session_id, question_id, student, db)
    assert from_cache is True
    assert text == "מהמטמון"
    assert calls["n"] == 0
    async with maker() as db:
        student = await db.get(User, student_id)
        fresh = await regenerate_exam_question_explanation(session_id, question_id, student, db)
    assert fresh == "הסבר חדש"
    assert calls["n"] == 1
    assert await _free(maker, student_id, STUDENT_AI) == STUDENT_FREE_CREDITS - 1


def test_sandbox_flag_selects_payme_host(monkeypatch):
    monkeypatch.setattr(settings, "payme_sandbox", True, raising=False)
    monkeypatch.setattr(settings, "payme_api_key", "pub-key", raising=False)
    assert sale_endpoint() == "https://sandbox.payme.io/api/generate-sale"
    assert sale_headers() == {"PayMe-Public-Key": "pub-key"}
    monkeypatch.setattr(settings, "payme_sandbox", False, raising=False)
    assert sale_endpoint() == "https://live.payme.io/api/generate-sale"


def test_settings_reject_zero_price():
    data = config_payload(default_config())
    data["packs"][0]["price_ils"] = 0
    with pytest.raises(ValueError):
        settings_from_payload(data)


@pytest.mark.asyncio
async def test_free_quota_change_hits_new_wallets_only(monkeypatch):
    maker = await _bind(monkeypatch)
    async with maker() as db:
        await lock_wallet(db, 21, STUDENT_AI)
        await db.commit()
    data = config_payload(default_config())
    data["student_free_credits"] = 1
    async with maker() as db:
        await save_billing_settings(db, data)
    async with maker() as db:
        old = await lock_wallet(db, 21, STUDENT_AI)
        new = await lock_wallet(db, 22, STUDENT_AI)
    assert old.free_remaining == STUDENT_FREE_CREDITS
    assert new.free_remaining == 1


@pytest.mark.asyncio
async def test_calls_per_credit_comes_from_settings(monkeypatch):
    maker = await _bind(monkeypatch)

    async def _ok(*_a, **_k):
        return "qcm"

    monkeypatch.setattr("app.services.ai_client._run_text", _ok)
    data = config_payload(default_config())
    data["calls_per_teacher_credit"] = 2
    async with maker() as db:
        await save_billing_settings(db, data)
    async with bill_ai(_user("teacher", 16), TEACHER_GENERATION, 8):
        for _ in range(3):
            await generate_text("batch", for_generation=True)
    assert await _free(maker, 16, TEACHER_GENERATION) == TEACHER_FREE_CREDITS - 2
