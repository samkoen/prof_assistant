from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course import CourseEnrollment
from app.models.enums import EnrollmentStatus, QuestionType
from app.models.exam import Answer, ExamSession, Question, StudentExamAttempt
from app.models.user import User
from app.services.gemini_client import GeminiError, generate_text

_TYPE_LABELS = {
    QuestionType.SINGLE: "בחירה יחידה",
    QuestionType.MULTIPLE: "בחירה מרובה",
    QuestionType.TRUE_FALSE: "נכון/לא נכון",
}


async def _student_approved(offering_id: int, user: User, db: AsyncSession) -> bool:
    row = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.offering_id == offering_id,
            CourseEnrollment.student_id == user.id,
            CourseEnrollment.status == EnrollmentStatus.APPROVED,
        )
    )
    return row.scalar_one_or_none() is not None


async def _load_review_context(
    session_id: int, question_id: int, user: User, db: AsyncSession
) -> tuple[Question, list[int]]:
    session_row = await db.execute(
        select(ExamSession)
        .options(selectinload(ExamSession.exam))
        .where(ExamSession.id == session_id)
    )
    session = session_row.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="מבחן לא נמצא")
    if not await _student_approved(session.offering_id, user, db):
        raise HTTPException(status_code=403, detail="אין גישה")

    exam = session.exam
    if not exam.show_detailed_correction:
        raise HTTPException(status_code=403, detail="הסבר אינו זמין למבחן זה")

    attempt_row = await db.execute(
        select(StudentExamAttempt).where(
            StudentExamAttempt.exam_session_id == session.id,
            StudentExamAttempt.student_id == user.id,
        )
    )
    attempt = attempt_row.scalar_one_or_none()
    if not attempt or not attempt.submitted_at:
        raise HTTPException(status_code=400, detail="יש להגיש את המבחן לפני בקשת הסבר")

    q_row = await db.execute(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.id == question_id, Question.exam_id == exam.id)
    )
    question = q_row.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="שאלה לא נמצאה")

    ans_row = await db.execute(
        select(Answer).where(Answer.attempt_id == attempt.id, Answer.question_id == question.id)
    )
    answer = ans_row.scalar_one_or_none()
    selected = list(answer.selected_option_ids) if answer else []
    return question, selected


def _option_label(index: int) -> str:
    return chr(65 + index)


def _format_options(question: Question) -> str:
    lines: list[str] = []
    for idx, opt in enumerate(sorted(question.options, key=lambda o: o.order_index)):
        mark = " (נכון)" if opt.is_correct else ""
        lines.append(f"{_option_label(idx)}) {opt.text.strip()}{mark}")
    return "\n".join(lines)


def _selected_labels(question: Question, selected_ids: list[int]) -> str:
    if not selected_ids:
        return "לא נבחרה תשובה"
    ordered = sorted(question.options, key=lambda o: o.order_index)
    labels: list[str] = []
    for idx, opt in enumerate(ordered):
        if opt.id in selected_ids:
            labels.append(f"{_option_label(idx)}) {opt.text.strip()}")
    if labels:
        return ", ".join(labels)
    return "לא נבחרה תשובה"


def _build_prompt(question: Question, selected_ids: list[int]) -> str:
    correct = sorted([o for o in question.options if o.is_correct], key=lambda o: o.order_index)
    correct_text = "; ".join(o.text.strip() for o in correct) or "—"
    type_label = _TYPE_LABELS.get(question.question_type, question.question_type)
    return f"""אתה עוזר לימודי למבחן QCM. ענה בעברית בלבד.

כללים:
- הסבר למה התשובה(ות) הנכונה(ות) נכונה(ות), בצורה ברורה ומעודדת.
- אם התלמיד טעה, הסבר בקצרה למה הבחירה שלו שגויה.
- אל תמציא עובדות שלא מופיעות בשאלה או באפשרויות.
- 6–10 משפטים לכל היותר.

סוג שאלה: {type_label}

שאלה:
{question.text.strip()}

אפשרויות:
{_format_options(question)}

תשובה נכונה: {correct_text}

תשובת התלמיד: {_selected_labels(question, selected_ids)}

כתוב הסבר פדגוגי:"""


async def explain_exam_question(
    session_id: int, question_id: int, user: User, db: AsyncSession
) -> str:
    question, selected = await _load_review_context(session_id, question_id, user, db)
    prompt = _build_prompt(question, selected)
    try:
        return await generate_text(prompt)
    except GeminiError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
