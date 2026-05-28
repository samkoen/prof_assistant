from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exam import AttemptIntegrityEvent, ExamSession, StudentExamAttempt
from app.models.user import User


async def get_student_attempt(
    session_id: int, student_id: int, db: AsyncSession
) -> StudentExamAttempt | None:
    result = await db.execute(
        select(StudentExamAttempt).where(
            StudentExamAttempt.exam_session_id == session_id,
            StudentExamAttempt.student_id == student_id,
        )
    )
    return result.scalar_one_or_none()


async def ensure_attempt_record(
    session: ExamSession, user: User, db: AsyncSession
) -> StudentExamAttempt:
    attempt = await get_student_attempt(session.id, user.id, db)
    if attempt:
        return attempt
    attempt = StudentExamAttempt(exam_session_id=session.id, student_id=user.id)
    db.add(attempt)
    await db.flush()
    return attempt


def rules_blocking(session: ExamSession, attempt: StudentExamAttempt | None) -> bool:
    if not session.integrity_mode_enabled:
        return False
    if attempt is None:
        return True
    return attempt.rules_accepted_at is None


async def accept_rules(session: ExamSession, user: User, db: AsyncSession) -> StudentExamAttempt:
    if not session.integrity_mode_enabled:
        raise HTTPException(status_code=400, detail="מצב מעקב מבחן לא פעיל")
    attempt = await ensure_attempt_record(session, user, db)
    if attempt.submitted_at and not attempt.can_resubmit:
        raise HTTPException(status_code=400, detail="כבר הוגש")
    if not attempt.rules_accepted_at:
        attempt.rules_accepted_at = datetime.now(timezone.utc)
    await db.flush()
    return attempt


async def get_owned_attempt(attempt_id: int, user: User, db: AsyncSession) -> StudentExamAttempt:
    result = await db.execute(
        select(StudentExamAttempt).where(
            StudentExamAttempt.id == attempt_id,
            StudentExamAttempt.student_id == user.id,
        )
    )
    attempt = result.scalar_one_or_none()
    if not attempt:
        raise HTTPException(status_code=404, detail="ניסיון לא נמצא")
    return attempt


def apply_integrity_event(attempt: StudentExamAttempt, event_type: str, duration: int | None) -> None:
    if event_type == "tab_hidden":
        attempt.focus_loss_count += 1
    elif event_type == "tab_visible" and duration and duration > 0:
        attempt.total_hidden_seconds += duration


async def record_events(
    attempt: StudentExamAttempt, session: ExamSession, events: list, db: AsyncSession
) -> StudentExamAttempt:
    if attempt.submitted_at and not attempt.can_resubmit:
        raise HTTPException(status_code=400, detail="כבר הוגש")
    if not session.integrity_mode_enabled:
        return attempt
    for item in events:
        apply_integrity_event(attempt, item.event_type, item.duration_seconds)
        db.add(
            AttemptIntegrityEvent(
                attempt_id=attempt.id,
                event_type=item.event_type,
                occurred_at=item.occurred_at or datetime.now(timezone.utc),
                duration_seconds=item.duration_seconds,
            )
        )
    await db.flush()
    return attempt
