from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import ExamStatus
from app.models.exam import (
    Answer,
    AttemptIntegrityEvent,
    Exam,
    ExamSession,
    Question,
    QuestionOption,
    StudentExamAttempt,
)


async def delete_attempt_records(attempt: StudentExamAttempt, db: AsyncSession) -> None:
    for answer in (
        await db.execute(select(Answer).where(Answer.attempt_id == attempt.id))
    ).scalars():
        await db.delete(answer)
    for event in (
        await db.execute(
            select(AttemptIntegrityEvent).where(AttemptIntegrityEvent.attempt_id == attempt.id)
        )
    ).scalars():
        await db.delete(event)
    await db.delete(attempt)


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


async def duplicate_exam(source: Exam, title: str, created_by_id: int, db: AsyncSession) -> Exam:
    result = await db.execute(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.exam_id == source.id)
        .order_by(Question.order_index, Question.id)
    )
    questions = result.scalars().all()

    copy = Exam(
        catalog_course_id=source.catalog_course_id,
        created_by_id=created_by_id,
        scope_teacher_id=source.scope_teacher_id,
        scope_academic_year=source.scope_academic_year,
        scope_semester=source.scope_semester,
        scope_group_name=source.scope_group_name,
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
    )
    db.add(copy)
    await db.flush()

    for q in questions:
        new_q = Question(
            exam_id=copy.id,
            text=q.text,
            question_type=q.question_type,
            order_index=q.order_index,
            points=q.points,
            multiple_scoring_mode=q.multiple_scoring_mode,
        )
        db.add(new_q)
        await db.flush()
        for opt in q.options:
            db.add(
                QuestionOption(
                    question_id=new_q.id,
                    text=opt.text,
                    is_correct=opt.is_correct,
                    order_index=opt.order_index,
                )
            )

    return copy


async def delete_exam_cascade(exam_id: int, db: AsyncSession) -> None:
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
