"""Soumission d'une משימה : pas de fichier = pas fait, sans appel IA."""

from datetime import datetime, timezone

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.models.course import CourseCatalog, CourseOffering
from app.models.enums import QuestionType, UserRole

from app.models.exam import Exam, ExamSession, StudentExamAttempt
from app.models.task import TaskProof, TaskReview, TaskStep
from app.models.user import User
from app.schemas.exam import QuestionCreate
from app.services.exam_kind import apply_task_kind
from app.services.exam_questions import persist_question
from app.services.task_review import finalize_task_submission
from tests.integration.conftest import open_sqlite_maker


async def _seed_task(db):
    user = User(email="t@task.test", password_hash="x", full_name="T", role=UserRole.TEACHER)
    student = User(email="s@task.test", password_hash="x", full_name="S", role=UserRole.STUDENT)
    db.add_all([user, student])
    await db.flush()
    catalog = CourseCatalog(name="C", teacher_id=user.id)
    db.add(catalog)
    await db.flush()
    exam = Exam(catalog_course_id=catalog.id, created_by_id=user.id, title="משימה", shuffle_questions=False, shuffle_options=False)
    apply_task_kind(exam)
    db.add(exam)
    await db.flush()
    offering = CourseOffering(
        catalog_course_id=catalog.id,
        teacher_id=user.id,
        group_name="א",
        academic_year=2026,
        semester=1,
        join_token="tok-task",
        join_token_expires_at=datetime.now(timezone.utc),
    )
    db.add(offering)
    await db.flush()
    session = ExamSession(exam_id=exam.id, offering_id=offering.id)
    db.add(session)
    await db.flush()
    first = TaskStep(exam_id=exam.id, order_index=0, title="א", instructions="עשה א", max_points=2)
    second = TaskStep(exam_id=exam.id, order_index=1, title="ב", instructions="עשה ב", max_points=3)
    db.add_all([first, second])
    await db.flush()
    attempt = StudentExamAttempt(exam_session_id=session.id, student_id=student.id, started_at=datetime.now(timezone.utc))
    db.add(attempt)
    await db.flush()
    db.add(TaskProof(attempt_id=attempt.id, step_id=first.id, filename="a.png", mime_type="image/png", file_data=b"png", size_bytes=3))
    await db.commit()
    return exam.id, attempt.id, first.id, second.id


@pytest.mark.asyncio
async def test_submit_without_file_is_not_done_and_skips_ai(monkeypatch):
    def boom(*_args, **_kwargs):
        raise AssertionError("l'IA ne doit pas partir à la soumission")

    monkeypatch.setattr("app.services.task_review.generate_text", boom)
    engine, maker = await open_sqlite_maker()
    async with maker() as db:
        exam_id, attempt_id, with_file, without_file = await _seed_task(db)
        exam = await db.get(Exam, exam_id)
        attempt = await db.get(StudentExamAttempt, attempt_id)
        await finalize_task_submission(attempt, exam, db)
        await db.commit()
        reviews = list((await db.execute(select(TaskReview))).scalars().all())
    await engine.dispose()
    assert attempt.score == 0
    assert attempt.max_score == 5
    assert len(reviews) == 1
    assert reviews[0].step_id == without_file
    assert reviews[0].verdict == "not_done"
    assert reviews[0].source == "auto"
    assert with_file != without_file


@pytest.mark.asyncio
async def test_task_refuses_questions():
    engine, maker = await open_sqlite_maker()
    async with maker() as db:
        exam_id, _attempt_id, _a, _b = await _seed_task(db)
        body = QuestionCreate(text="שאלה", question_type=QuestionType.OPEN, points=1, options=[])
        with pytest.raises(HTTPException) as caught:
            await persist_question(exam_id, body, 0, db)
    await engine.dispose()
    assert caught.value.status_code == 400
