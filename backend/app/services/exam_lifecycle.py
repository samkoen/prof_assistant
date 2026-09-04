from datetime import datetime, timezone

from sqlalchemy import and_, exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course import CourseEnrollment, CourseOffering
from app.models.enums import EnrollmentStatus, ExamStatus, NotificationType
from app.models.exam import (
    Answer,
    AttemptIntegrityEvent,
    Exam,
    ExamPracticeResult,
    ExamSession,
    PracticeAnswer,
    Question,
    QuestionAiExplanation,
    QuestionOption,
    StudentExamAttempt,
)
from app.models.exam_gemini_generation import (
    ExamGeminiGenerationMessage,
    ExamGeminiGenerationSession,
)
from app.models.exam_gemini_source import ExamGeminiSource
from app.models.notification import Notification
from app.services.catalog_scope import catalog_item_matches_offering
from app.services.exam_kind import apply_exam_kind, is_tirgoul
from app.services.question_media import copy_image_url_for_duplicate


async def delete_attempt_records(attempt: StudentExamAttempt, db: AsyncSession) -> None:
    for answer in (
        await db.execute(select(Answer).where(Answer.attempt_id == attempt.id))
    ).scalars():
        await db.delete(answer)
    for answer in (
        await db.execute(select(PracticeAnswer).where(PracticeAnswer.attempt_id == attempt.id))
    ).scalars():
        await db.delete(answer)
    for result in (
        await db.execute(
            select(ExamPracticeResult).where(ExamPracticeResult.attempt_id == attempt.id)
        )
    ).scalars():
        await db.delete(result)
    for expl in (
        await db.execute(
            select(QuestionAiExplanation).where(QuestionAiExplanation.attempt_id == attempt.id)
        )
    ).scalars():
        await db.delete(expl)
    for event in (
        await db.execute(
            select(AttemptIntegrityEvent).where(AttemptIntegrityEvent.attempt_id == attempt.id)
        )
    ).scalars():
        await db.delete(event)
    await db.delete(attempt)


async def ensure_draft_session(
    exam_id: int, offering_id: int, db: AsyncSession
) -> ExamSession:
    """Session brouillon pour un groupe — affichage « טיוטה » et édition avant activation."""
    result = await db.execute(
        select(ExamSession).where(
            ExamSession.exam_id == exam_id,
            ExamSession.offering_id == offering_id,
        )
    )
    session = result.scalar_one_or_none()
    if session:
        return session
    session = ExamSession(
        exam_id=exam_id,
        offering_id=offering_id,
        status=ExamStatus.DRAFT,
    )
    db.add(session)
    await db.flush()
    return session


async def _matching_tirgoul_offerings(exam: Exam, db: AsyncSession) -> list[CourseOffering]:
    rows = await db.execute(
        select(CourseOffering).where(CourseOffering.catalog_course_id == exam.catalog_course_id)
    )
    return [o for o in rows.scalars().all() if catalog_item_matches_offering(exam, o)]


async def _ensure_tirgoul_offering_sessions(exam: Exam, db: AsyncSession) -> None:
    for offering in await _matching_tirgoul_offerings(exam, db):
        await ensure_draft_session(exam.id, offering.id, db)


async def _activate_draft_tirgoul_sessions(exam: Exam, db: AsyncSession) -> None:
    result = await db.execute(select(ExamSession).where(ExamSession.exam_id == exam.id))
    now = datetime.now(timezone.utc)
    for session in result.scalars().all():
        if session.status != ExamStatus.DRAFT:
            continue
        session.status = ExamStatus.ACTIVE
        session.activated_at = now
        session.integrity_mode_enabled = False
        await notify_exam_available_to_pending_students(session, exam, db)


async def open_tirgoul_sessions_if_ready(exam: Exam | None, db: AsyncSession) -> None:
    if not is_tirgoul(exam):
        return
    assert exam is not None
    qcount = await db.scalar(select(func.count()).select_from(Question).where(Question.exam_id == exam.id))
    if not qcount:
        return
    await _ensure_tirgoul_offering_sessions(exam, db)
    await _activate_draft_tirgoul_sessions(exam, db)


async def exams_can_delete_map(exam_ids: list[int], db: AsyncSession) -> dict[int, bool]:
    if not exam_ids:
        return {}
    rows = await db.execute(
        select(ExamSession.exam_id)
        .where(ExamSession.exam_id.in_(exam_ids), ExamSession.status != ExamStatus.DRAFT)
        .distinct()
    )
    blocked = set(rows.scalars().all())
    return {exam_id: exam_id not in blocked for exam_id in exam_ids}


async def exam_has_non_draft_sessions(exam_id: int, db: AsyncSession) -> bool:
    count = await db.scalar(
        select(func.count())
        .select_from(ExamSession)
        .where(ExamSession.exam_id == exam_id, ExamSession.status != ExamStatus.DRAFT)
    )
    return (count or 0) > 0


async def duplicate_exam_to_catalog(
    source: Exam,
    *,
    target_catalog_course_id: int,
    owner_teacher_id: int,
    title: str,
    db: AsyncSession,
) -> Exam:
    result = await db.execute(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.exam_id == source.id)
        .order_by(Question.order_index, Question.id)
    )
    questions = result.scalars().all()

    copy = Exam(
        catalog_course_id=target_catalog_course_id,
        created_by_id=owner_teacher_id,
        scope_teacher_id=owner_teacher_id,
        scope_academic_year=None,
        scope_semester=None,
        scope_group_name=None,
        title=title,
        description=source.description,
        duration_minutes=source.duration_minutes,
        shuffle_questions=source.shuffle_questions,
        shuffle_options=source.shuffle_options,
        show_detailed_correction=source.show_detailed_correction,
        warning_minutes=source.warning_minutes,
        auto_submit_on_timeout=source.auto_submit_on_timeout,
        default_multiple_scoring=source.default_multiple_scoring,
        questions_language=source.questions_language,
        is_tirgoul=source.is_tirgoul,
    )
    apply_exam_kind(copy, bool(source.is_tirgoul))
    db.add(copy)
    await db.flush()

    for q in questions:
        new_q = Question(
            exam_id=copy.id,
            text=q.text,
            image_url=copy_image_url_for_duplicate(q.image_url, source.id, copy.id),
            question_type=q.question_type,
            order_index=q.order_index,
            points=q.points,
            multiple_scoring_mode=q.multiple_scoring_mode,
            model_answer=q.model_answer,
            model_answer_source=q.model_answer_source,
        )
        db.add(new_q)
        await db.flush()
        for opt in q.options:
            db.add(
                QuestionOption(
                    question_id=new_q.id,
                    text=opt.text,
                    image_url=copy_image_url_for_duplicate(opt.image_url, source.id, copy.id),
                    is_correct=opt.is_correct,
                    order_index=opt.order_index,
                )
            )

    return copy


async def duplicate_exam(source: Exam, title: str, created_by_id: int, db: AsyncSession) -> Exam:
    return await duplicate_exam_to_catalog(
        source,
        target_catalog_course_id=source.catalog_course_id,
        owner_teacher_id=created_by_id,
        title=title,
        db=db,
    )


async def _delete_gemini_generation_for_exam(exam_id: int, db: AsyncSession) -> None:
    sessions = (
        await db.execute(
            select(ExamGeminiGenerationSession).where(ExamGeminiGenerationSession.exam_id == exam_id)
        )
    ).scalars().all()
    for session in sessions:
        for msg in (
            await db.execute(
                select(ExamGeminiGenerationMessage).where(
                    ExamGeminiGenerationMessage.session_id == session.id
                )
            )
        ).scalars():
            await db.delete(msg)
        await db.delete(session)


async def _delete_gemini_sources_for_exam(exam_id: int, db: AsyncSession) -> None:
    for src in (
        await db.execute(select(ExamGeminiSource).where(ExamGeminiSource.exam_id == exam_id))
    ).scalars():
        await db.delete(src)


async def _clear_exam_notifications(exam_id: int, db: AsyncSession) -> None:
    result = await db.execute(select(Notification).where(Notification.related_exam_id == exam_id))
    for notif in result.scalars():
        notif.related_exam_id = None


async def delete_exam_cascade(exam_id: int, db: AsyncSession) -> None:
    await _delete_gemini_generation_for_exam(exam_id, db)
    await _delete_gemini_sources_for_exam(exam_id, db)
    await _clear_exam_notifications(exam_id, db)
    sessions = (
        await db.execute(select(ExamSession).where(ExamSession.exam_id == exam_id))
    ).scalars().all()
    for session in sessions:
        attempts = (
            await db.execute(
                select(StudentExamAttempt).where(StudentExamAttempt.exam_session_id == session.id)
            )
        ).scalars().all()
        for attempt in attempts:
            await delete_attempt_records(attempt, db)
        await db.delete(session)

    questions = (
        await db.execute(select(Question).where(Question.exam_id == exam_id))
    ).scalars().all()
    for question in questions:
        for opt in (
            await db.execute(select(QuestionOption).where(QuestionOption.question_id == question.id))
        ).scalars():
            await db.delete(opt)
        await db.delete(question)

    exam = await db.get(Exam, exam_id)
    if exam:
        await db.delete(exam)


def attempt_in_progress(attempt: StudentExamAttempt | None) -> bool:
    return bool(attempt and attempt.started_at and not attempt.submitted_at)


def attempt_submitted(attempt: StudentExamAttempt | None) -> bool:
    return bool(attempt and attempt.submitted_at and not attempt.can_resubmit)


def session_allows_student_work(
    session: ExamSession, attempt: StudentExamAttempt | None
) -> bool:
    """Accès passation / brouillon : actif (sans copie déjà rendue), ou fermé si en cours."""
    if attempt_submitted(attempt):
        return False
    if session.status == ExamStatus.ACTIVE:
        return True
    if session.status == ExamStatus.CLOSED and not session.results_published:
        return attempt_in_progress(attempt)
    return False


async def notify_exam_available_to_pending_students(
    session: ExamSession, exam: Exam, db: AsyncSession
) -> None:
    """Notifie les inscrits qui n'ont pas encore rendu le mבחן."""
    attempts = (
        await db.execute(
            select(StudentExamAttempt).where(StudentExamAttempt.exam_session_id == session.id)
        )
    ).scalars().all()
    submitted_ids = {
        a.student_id for a in attempts if a.submitted_at and not a.can_resubmit
    }
    enrollments = (
        await db.execute(
            select(CourseEnrollment).where(
                CourseEnrollment.offering_id == session.offering_id,
                CourseEnrollment.status == EnrollmentStatus.APPROVED,
            )
        )
    ).scalars().all()
    for enr in enrollments:
        if enr.student_id in submitted_ids:
            continue
        db.add(
            Notification(
                user_id=enr.student_id,
                type=NotificationType.EXAM_AVAILABLE,
                title="מבחן זמין שוב",
                body=exam.title,
                related_exam_id=exam.id,
                related_offering_id=session.offering_id,
            )
        )


def student_visible_sessions_clause(student_id: int):
    """Session active, ou fermée visible si l'élève a soumis ou est encore en cours."""
    in_progress = exists(
        select(StudentExamAttempt.id).where(
            StudentExamAttempt.exam_session_id == ExamSession.id,
            StudentExamAttempt.student_id == student_id,
            StudentExamAttempt.started_at.isnot(None),
            StudentExamAttempt.submitted_at.is_(None),
        )
    )
    submitted = exists(
        select(StudentExamAttempt.id).where(
            StudentExamAttempt.exam_session_id == ExamSession.id,
            StudentExamAttempt.student_id == student_id,
            StudentExamAttempt.submitted_at.isnot(None),
        )
    )
    return or_(
        ExamSession.status == ExamStatus.ACTIVE,
        and_(ExamSession.status == ExamStatus.CLOSED, or_(in_progress, submitted)),
    )
