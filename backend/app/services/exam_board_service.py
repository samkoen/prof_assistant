"""Agrégats pour tableaux de bord examens (un seul round-trip HTTP)."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course import CourseEnrollment, CourseOffering
from app.models.enums import EnrollmentStatus, ExamStatus
from app.models.exam import ExamSession, Question, StudentExamAttempt
from app.models.user import User
from app.schemas.exam import AttemptResponse, ExamSessionResponse, StudentExamSessionRow
from app.services.exam_lifecycle import student_visible_sessions_clause


async def question_counts_by_exam_id(
    exam_ids: list[int], db: AsyncSession
) -> dict[int, int]:
    if not exam_ids:
        return {}
    rows = await db.execute(
        select(Question.exam_id, func.count())
        .where(Question.exam_id.in_(exam_ids))
        .group_by(Question.exam_id)
    )
    return {exam_id: int(cnt) for exam_id, cnt in rows.all()}


async def load_student_exam_sessions(user: User, db: AsyncSession) -> list[ExamSession]:
    result = await db.execute(
        select(ExamSession)
        .join(CourseOffering)
        .join(CourseEnrollment)
        .options(
            selectinload(ExamSession.exam),
            selectinload(ExamSession.offering).selectinload(CourseOffering.catalog_course),
        )
        .where(
            CourseEnrollment.student_id == user.id,
            CourseEnrollment.status == EnrollmentStatus.APPROVED,
            CourseEnrollment.offering_id == ExamSession.offering_id,
            student_visible_sessions_clause(user.id),
        )
        .order_by(ExamSession.created_at.desc())
    )
    return list(result.scalars().unique().all())


async def active_exam_counts_for_student(
    user_id: int, db: AsyncSession
) -> dict[int, int]:
    rows = await db.execute(
        select(ExamSession.offering_id, func.count())
        .select_from(ExamSession)
        .join(
            CourseEnrollment,
            CourseEnrollment.offering_id == ExamSession.offering_id,
        )
        .where(
            CourseEnrollment.student_id == user_id,
            CourseEnrollment.status == EnrollmentStatus.APPROVED,
            ExamSession.status == ExamStatus.ACTIVE,
            student_visible_sessions_clause(user_id),
        )
        .group_by(ExamSession.offering_id)
    )
    return {offering_id: int(cnt) for offering_id, cnt in rows.all()}


def session_response(
    session: ExamSession, question_count: int = 0
) -> ExamSessionResponse:
    offering = session.offering
    return ExamSessionResponse(
        id=session.id,
        exam_id=session.exam_id,
        offering_id=session.offering_id,
        exam_title=session.exam.title,
        catalog_name=offering.catalog_course.name,
        group_name=offering.group_name,
        academic_year=offering.academic_year,
        semester=offering.semester,
        status=session.status,
        activated_at=session.activated_at,
        closed_at=session.closed_at,
        results_published=session.results_published,
        integrity_mode_enabled=session.integrity_mode_enabled,
        question_count=question_count,
    )


def attempt_response(attempt: StudentExamAttempt, exam_id: int) -> AttemptResponse:
    return AttemptResponse(
        id=attempt.id,
        exam_session_id=attempt.exam_session_id,
        exam_id=exam_id,
        started_at=attempt.started_at,
        expires_at=attempt.expires_at,
        submitted_at=attempt.submitted_at,
        score=attempt.score,
        max_score=attempt.max_score,
        progress_index=attempt.progress_index,
        can_resubmit=attempt.can_resubmit,
        practice_active=attempt.practice_active,
        practice_score=attempt.practice_score,
        practice_max_score=attempt.practice_max_score,
        practice_submitted_at=attempt.practice_submitted_at,
        rules_accepted_at=attempt.rules_accepted_at,
        focus_loss_count=attempt.focus_loss_count,
        total_hidden_seconds=attempt.total_hidden_seconds,
    )


async def sessions_to_responses(
    sessions: list[ExamSession], db: AsyncSession
) -> list[ExamSessionResponse]:
    counts = await question_counts_by_exam_id([s.exam_id for s in sessions], db)
    return [session_response(s, counts.get(s.exam_id, 0)) for s in sessions]


async def build_student_session_rows(
    sessions: list[ExamSession], student_id: int, db: AsyncSession
) -> list[StudentExamSessionRow]:
    if not sessions:
        return []
    counts = await question_counts_by_exam_id([s.exam_id for s in sessions], db)
    session_ids = [s.id for s in sessions]
    attempt_rows = await db.execute(
        select(StudentExamAttempt).where(
            StudentExamAttempt.student_id == student_id,
            StudentExamAttempt.exam_session_id.in_(session_ids),
        )
    )
    attempts_by_session = {
        a.exam_session_id: a for a in attempt_rows.scalars().all()
    }
    rows: list[StudentExamSessionRow] = []
    for session in sessions:
        base = session_response(session, counts.get(session.exam_id, 0))
        attempt = attempts_by_session.get(session.id)
        rows.append(
            StudentExamSessionRow(
                **base.model_dump(),
                attempt=attempt_response(attempt, session.exam_id) if attempt else None,
            )
        )
    return rows
