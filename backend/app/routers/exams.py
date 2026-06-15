import random
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from starlette.responses import Response

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.course import CourseCatalog, CourseEnrollment, CourseOffering
from app.models.enums import EnrollmentStatus, ExamStatus, UserRole
from app.models.exam import Answer, Exam, ExamSession, Question, QuestionOption, StudentExamAttempt
from app.models.notification import Notification
from app.models.enums import NotificationType
from app.models.user import User
from app.schemas.gemini_questions import (
    GeminiGenerateQuestionsRequest,
    GeminiGenerateQuestionsResponse,
)
from app.schemas.exam import (
    AttemptResponse,
    ExamCreate,
    ExamDetailResponse,
    ExamDuplicateRequest,
    ExamReviewCorrectOption,
    ExamReviewQuestion,
    ExamReviewResponse,
    ExamResponse,
    ExamTakeResponse,
    ExamUpdate,
    PracticeResultResponse,
    ExamSessionActivate,
    ExamSessionResponse,
    ExamSessionResultsResponse,
    IntegrityEventsRequest,
    QuestionCreate,
    QuestionResponse,
    QuestionUpdate,
    QuestionsImportRequest,
    QuestionsImportResponse,
    QuestionsReorderRequest,
    StudentExamResultRow,
    SavedAnswerDraft,
    SubmitExamRequest,
    StudentQuestionOptionResponse,
    StudentQuestionResponse,
)
from app.services.exam_lifecycle import (
    delete_exam_cascade,
    student_visible_sessions_clause,
    duplicate_exam,
    ensure_draft_session,
    exam_has_non_draft_sessions,
    exams_can_delete_map,
    notify_exam_available_to_pending_students,
    session_allows_student_work,
)
from app.services.exam_questions import (
    delete_question,
    exam_has_active_sessions,
    next_question_order_index,
    persist_question,
    reorder_questions,
    update_question,
    validate_question_body,
)
from app.services.catalog_item_response import scope_to_response
from app.services.catalog_teacher import enforce_teacher_scope_id, teacher_owns_catalog
from app.services.catalog_scope import (
    apply_scope_fields,
    catalog_item_matches_offering,
    catalog_item_visible_to_teacher,
    load_scope_teacher_names,
    scope_teacher_filter,
    teacher_can_edit_catalog_item,
    widen_scope_for_offering,
)

from app.services.gemini_question_generation import generate_exam_questions_text
from app.services.exam_pdf import build_exam_pdf_bytes, pdf_content_disposition
from app.services.exam_practice_service import (
    finalize_practice_submission,
    get_submitted_attempt,
    list_practice_results,
    practice_answers_map,
    save_practice_answers,
    start_practice,
)
from app.services.exam_submit_service import (
    auto_submit_if_expired,
    finalize_exam_submission,
    save_draft_answers,
)
from app.services.scoring import score_question
from app.services.integrity_service import (
    accept_rules,
    ensure_attempt_record,
    get_owned_attempt,
    record_events,
    rules_blocking,
)

router = APIRouter(prefix="/exams", tags=["exams"])


def _exam_response(
    exam: Exam,
    question_count: int = 0,
    names: dict[int, str] | None = None,
    *,
    can_delete: bool = True,
) -> ExamResponse:
    names = names or {}
    return ExamResponse(
        id=exam.id,
        catalog_course_id=exam.catalog_course_id,
        title=exam.title,
        description=exam.description,
        duration_minutes=exam.duration_minutes,
        shuffle_questions=exam.shuffle_questions,
        shuffle_options=exam.shuffle_options,
        show_detailed_correction=exam.show_detailed_correction,
        warning_minutes=exam.warning_minutes,
        auto_submit_on_timeout=exam.auto_submit_on_timeout,
        default_multiple_scoring=exam.default_multiple_scoring,
        questions_language=exam.questions_language,
        question_count=question_count,
        can_delete=can_delete,
        **scope_to_response(exam, names),
    )


def _session_response(session: ExamSession, question_count: int = 0) -> ExamSessionResponse:
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


async def _get_teacher_exam(exam_id: int, user: User, db: AsyncSession) -> Exam:
    exam = await db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="מבחן לא נמצא")
    catalog = await db.get(CourseCatalog, exam.catalog_course_id)
    if not catalog:
        raise HTTPException(status_code=404, detail="קורס קטלוג לא נמצא")
    if user.role == UserRole.ADMIN:
        return exam
    if not teacher_can_edit_catalog_item(exam, user, catalog.teacher_id):
        raise HTTPException(status_code=403, detail="אין הרשאה")
    return exam


async def _get_teacher_session(session_id: int, user: User, db: AsyncSession) -> ExamSession:
    result = await db.execute(
        select(ExamSession)
        .join(CourseOffering)
        .options(
            selectinload(ExamSession.exam),
            selectinload(ExamSession.offering).selectinload(CourseOffering.catalog_course),
        )
        .where(ExamSession.id == session_id, CourseOffering.teacher_id == user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="מפגש מבחן לא נמצא")
    return session


async def _student_approved_for_offering(offering_id: int, user: User, db: AsyncSession) -> bool:
    approved = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.offering_id == offering_id,
            CourseEnrollment.student_id == user.id,
            CourseEnrollment.status == EnrollmentStatus.APPROVED,
        )
    )
    return approved.scalar_one_or_none() is not None


async def _get_student_active_session(session_id: int, user: User, db: AsyncSession) -> ExamSession:
    result = await db.execute(
        select(ExamSession)
        .options(selectinload(ExamSession.exam))
        .where(ExamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="מבחן לא נמצא")
    if session.status != ExamStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="המבחן לא פעיל")
    if not await _student_approved_for_offering(session.offering_id, user, db):
        raise HTTPException(status_code=403, detail="אין גישה")
    return session


async def _get_student_session(session_id: int, user: User, db: AsyncSession) -> ExamSession:
    """Session accessible à l'élève inscrit (active ou fermée)."""
    result = await db.execute(
        select(ExamSession)
        .options(selectinload(ExamSession.exam))
        .where(ExamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="מבחן לא נמצא")
    if not await _student_approved_for_offering(session.offering_id, user, db):
        raise HTTPException(status_code=403, detail="אין גישה")
    return session


async def _saved_answers_for_attempt(attempt_id: int, db: AsyncSession) -> list[SavedAnswerDraft]:
    result = await db.execute(select(Answer).where(Answer.attempt_id == attempt_id))
    return [
        SavedAnswerDraft(question_id=a.question_id, selected_option_ids=list(a.selected_option_ids or []))
        for a in result.scalars()
    ]


def _take_meta(session: ExamSession, exam: Exam) -> dict:
    return {
        "session_id": session.id,
        "offering_id": session.offering_id,
        "exam_title": exam.title,
        "description": exam.description,
        "duration_minutes": exam.duration_minutes,
        "warning_minutes": exam.warning_minutes,
        "auto_submit_on_timeout": exam.auto_submit_on_timeout,
        "integrity_mode_enabled": session.integrity_mode_enabled,
        "questions_language": exam.questions_language,
    }


def _attempt_response(attempt: StudentExamAttempt, exam_id: int) -> AttemptResponse:
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


def _student_paper(exam: Exam, questions: list[Question], attempt_id: int) -> list[StudentQuestionResponse]:
    rng = random.Random(attempt_id)
    ordered = list(questions)
    if exam.shuffle_questions:
        rng.shuffle(ordered)
    out: list[StudentQuestionResponse] = []
    for qi, q in enumerate(ordered):
        opts = list(q.options)
        if exam.shuffle_options:
            rng.shuffle(opts)
        out.append(
            StudentQuestionResponse(
                id=q.id,
                text=q.text,
                image_url=q.image_url,
                question_type=q.question_type,
                order_index=qi,
                points=q.points,
                options=[
                    StudentQuestionOptionResponse(
                        id=o.id, text=o.text, image_url=o.image_url, order_index=oi
                    )
                    for oi, o in enumerate(opts)
                ],
            )
        )
    return out


def _practice_paper(exam: Exam, questions: list[Question], attempt_id: int) -> list[StudentQuestionResponse]:
    rng = random.Random(attempt_id ^ 0x5A5A5A5A)
    ordered = list(questions)
    if exam.shuffle_questions:
        rng.shuffle(ordered)
    out: list[StudentQuestionResponse] = []
    for qi, q in enumerate(ordered):
        opts = list(q.options)
        if exam.shuffle_options:
            rng.shuffle(opts)
        out.append(
            StudentQuestionResponse(
                id=q.id,
                text=q.text,
                image_url=q.image_url,
                question_type=q.question_type,
                order_index=qi,
                points=q.points,
                options=[
                    StudentQuestionOptionResponse(
                        id=o.id, text=o.text, image_url=o.image_url, order_index=oi
                    )
                    for oi, o in enumerate(opts)
                ],
            )
        )
    return out


def _build_review_rows(
    exam: Exam,
    questions_list: list[Question],
    attempt_id: int,
    selected_by_q: dict[int, list[int]],
    *,
    practice_order: bool = False,
) -> list[ExamReviewQuestion]:
    questions_by_id = {q.id: q for q in questions_list}
    paper = (
        _practice_paper(exam, questions_list, attempt_id)
        if practice_order
        else _student_paper(exam, questions_list, attempt_id)
    )
    rows: list[ExamReviewQuestion] = []
    for sq in paper:
        q = questions_by_id[sq.id]
        selected_ids = selected_by_q.get(q.id, [])
        earned, max_pts = score_question(q, selected_ids)
        is_fully_correct = earned >= max_pts - 1e-9
        correct_opts = sorted([o for o in q.options if o.is_correct], key=lambda o: o.order_index)
        student_opts = sorted(
            [o for o in q.options if o.id in selected_ids],
            key=lambda o: o.order_index,
        )
        rows.append(
            ExamReviewQuestion(
                id=q.id,
                text=q.text,
                image_url=q.image_url,
                question_type=q.question_type,
                order_index=sq.order_index,
                points=q.points,
                is_correct=is_fully_correct,
                correct_options=[
                    ExamReviewCorrectOption(text=o.text, image_url=o.image_url) for o in correct_opts
                ],
                student_options=(
                    [ExamReviewCorrectOption(text=o.text, image_url=o.image_url) for o in student_opts]
                    if not is_fully_correct
                    else []
                ),
            )
        )
    return rows


async def _load_exam_questions(exam_id: int, db: AsyncSession) -> list[Question]:
    result = await db.execute(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.exam_id == exam_id)
        .order_by(Question.order_index, Question.id)
    )
    return list(result.scalars().all())


async def _ensure_attempt_started(
    session: ExamSession, user: User, db: AsyncSession
) -> StudentExamAttempt:
    exam = session.exam
    attempt_result = await db.execute(
        select(StudentExamAttempt).where(
            StudentExamAttempt.exam_session_id == session.id,
            StudentExamAttempt.student_id == user.id,
        )
    )
    attempt = attempt_result.scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if not attempt:
        attempt = StudentExamAttempt(
            exam_session_id=session.id,
            student_id=user.id,
            session_token=secrets.token_hex(32),
        )
        db.add(attempt)
    if attempt.submitted_at and not attempt.can_resubmit:
        raise HTTPException(status_code=400, detail="כבר הוגש")
    if session.integrity_mode_enabled and not attempt.rules_accepted_at:
        raise HTTPException(status_code=400, detail="יש לאשר את כללי המבחן")
    if not attempt.started_at or attempt.can_resubmit:
        attempt.started_at = now
        attempt.expires_at = now + timedelta(minutes=exam.duration_minutes)
        attempt.can_resubmit = False
        attempt.session_token = secrets.token_hex(32)
    await db.flush()
    return attempt


@router.post("", response_model=ExamResponse)
async def create_exam(
    body: ExamCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    catalog = await db.get(CourseCatalog, body.catalog_course_id)
    if not catalog:
        raise HTTPException(status_code=404, detail="קורס קטלוג לא נמצא")
    if user.role == UserRole.TEACHER and catalog.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="אין הרשאה")
    body.scope_teacher_id = enforce_teacher_scope_id(user, body.scope_teacher_id)
    if body.scope_teacher_id is not None and user.role == UserRole.TEACHER and body.scope_teacher_id != user.id:
        raise HTTPException(status_code=403, detail="לא ניתן להגביל למורה אחר")
    exam = Exam(
        catalog_course_id=body.catalog_course_id,
        title=body.title,
        description=body.description,
        duration_minutes=body.duration_minutes,
        shuffle_questions=body.shuffle_questions,
        shuffle_options=body.shuffle_options,
        show_detailed_correction=body.show_detailed_correction,
        warning_minutes=body.warning_minutes,
        auto_submit_on_timeout=body.auto_submit_on_timeout,
        default_multiple_scoring=body.default_multiple_scoring,
    )
    apply_scope_fields(exam, body, user.id)
    db.add(exam)
    await db.flush()
    if body.offering_id:
        offering = await db.get(CourseOffering, body.offering_id)
        if offering and offering.catalog_course_id == exam.catalog_course_id:
            await ensure_draft_session(exam.id, offering.id, db)
    await db.commit()
    await db.refresh(exam)
    names = await load_scope_teacher_names(db, [exam])
    return _exam_response(exam, 0, names, can_delete=True)


@router.get("/catalog/{catalog_course_id}", response_model=list[ExamResponse])
async def list_catalog_exams(
    catalog_course_id: int,
    offering_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    catalog = await db.get(CourseCatalog, catalog_course_id)
    if not catalog:
        raise HTTPException(status_code=404, detail="קורס קטלוג לא נמצא")
    if user.role == UserRole.TEACHER and not teacher_owns_catalog(catalog, user):
        raise HTTPException(status_code=403, detail="אין הרשאה")

    q = select(Exam).where(Exam.catalog_course_id == catalog_course_id)
    if user.role == UserRole.TEACHER:
        q = q.where(scope_teacher_filter(Exam, user.id))
    result = await db.execute(q)
    exams = list(result.scalars().all())

    offering = None
    if offering_id is not None:
        offering = await db.get(CourseOffering, offering_id)
        if offering and offering.catalog_course_id == catalog_course_id:
            exams = [e for e in exams if catalog_item_matches_offering(e, offering)]

    names = await load_scope_teacher_names(db, exams)
    delete_map = await exams_can_delete_map([e.id for e in exams], db)
    out = []
    for exam in exams:
        cnt = await db.scalar(
            select(func.count()).select_from(Question).where(Question.exam_id == exam.id)
        )
        out.append(
            _exam_response(exam, cnt or 0, names, can_delete=delete_map.get(exam.id, True))
        )
    return out


@router.get("/sessions/offering/{offering_id}", response_model=list[ExamSessionResponse])
async def list_offering_exam_sessions(
    offering_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    offering = await db.get(CourseOffering, offering_id)
    if not offering:
        raise HTTPException(status_code=404, detail="קורס לא נמצא")
    if user.role == UserRole.TEACHER and offering.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="אין הרשאה")
    if user.role == UserRole.STUDENT:
        approved = await db.execute(
            select(CourseEnrollment).where(
                CourseEnrollment.offering_id == offering_id,
                CourseEnrollment.student_id == user.id,
                CourseEnrollment.status == EnrollmentStatus.APPROVED,
            )
        )
        if not approved.scalar_one_or_none():
            return []
    q = (
        select(ExamSession)
        .options(
            selectinload(ExamSession.exam),
            selectinload(ExamSession.offering).selectinload(CourseOffering.catalog_course),
        )
        .where(ExamSession.offering_id == offering_id)
    )
    if user.role == UserRole.STUDENT:
        q = q.where(student_visible_sessions_clause(user.id))
    q = q.order_by(ExamSession.created_at.desc())
    sessions = (await db.execute(q)).scalars().all()
    out = []
    for session in sessions:
        cnt = await db.scalar(
            select(func.count()).select_from(Question).where(Question.exam_id == session.exam_id)
        )
        out.append(_session_response(session, cnt or 0))
    return out


@router.get("/sessions/mine", response_model=list[ExamSessionResponse])
async def list_my_exam_sessions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role == UserRole.TEACHER:
        result = await db.execute(
            select(ExamSession)
            .join(CourseOffering)
            .options(
                selectinload(ExamSession.exam),
                selectinload(ExamSession.offering).selectinload(CourseOffering.catalog_course),
            )
            .where(CourseOffering.teacher_id == user.id)
            .order_by(ExamSession.created_at.desc())
        )
    elif user.role == UserRole.STUDENT:
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
    else:
        return []
    sessions = result.scalars().unique().all()
    out = []
    for session in sessions:
        cnt = await db.scalar(
            select(func.count()).select_from(Question).where(Question.exam_id == session.exam_id)
        )
        out.append(_session_response(session, cnt or 0))
    return out


@router.patch("/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: int,
    body: ExamUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    exam = await _get_teacher_exam(exam_id, user, db)
    data = body.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="אין שדות לעדכון")
    scope_keys = {"scope_teacher_id", "scope_academic_year", "scope_semester", "scope_group_name"}
    non_title = [k for k in data if k != "title"]
    if non_title and await exam_has_active_sessions(exam_id, db):
        raise HTTPException(status_code=400, detail="לא ניתן לערוך מבחן פעיל")
    if "scope_teacher_id" in data:
        data["scope_teacher_id"] = enforce_teacher_scope_id(user, data["scope_teacher_id"])
    if (
        data.get("scope_teacher_id") is not None
        and user.role == UserRole.TEACHER
        and data["scope_teacher_id"] != user.id
    ):
        raise HTTPException(status_code=403, detail="לא ניתן להגביל למורה אחר")
    for key, value in data.items():
        setattr(exam, key, value)
    await db.commit()
    await db.refresh(exam)
    cnt = await db.scalar(
        select(func.count()).select_from(Question).where(Question.exam_id == exam_id)
    )
    names = await load_scope_teacher_names(db, [exam])
    can_delete = not await exam_has_non_draft_sessions(exam_id, db)
    return _exam_response(exam, cnt or 0, names, can_delete=can_delete)


@router.post("/{exam_id}/duplicate", response_model=ExamResponse)
async def copy_exam(
    exam_id: int,
    body: ExamDuplicateRequest | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    source = await _get_teacher_exam(exam_id, user, db)
    body = body or ExamDuplicateRequest()
    title = (body.title or "").strip() or f"{source.title} (עותק)"
    copy = await duplicate_exam(source, title, user.id, db)
    await db.commit()
    await db.refresh(copy)
    cnt = await db.scalar(
        select(func.count()).select_from(Question).where(Question.exam_id == copy.id)
    )
    names = await load_scope_teacher_names(db, [copy])
    return _exam_response(copy, cnt or 0, names, can_delete=True)


@router.post("/{exam_id}/attach-offering", response_model=ExamResponse)
async def attach_exam_to_offering(
    exam_id: int,
    body: ExamSessionActivate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    exam = await _get_teacher_exam(exam_id, user, db)
    if await exam_has_active_sessions(exam_id, db):
        raise HTTPException(status_code=400, detail="לא ניתן לערוך מבחן פעיל")
    offering = await db.get(CourseOffering, body.offering_id)
    if not offering:
        raise HTTPException(status_code=404, detail="קורס לא נמצא")
    if user.role == UserRole.TEACHER and offering.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="אין הרשאה")
    if offering.catalog_course_id != exam.catalog_course_id:
        raise HTTPException(status_code=400, detail="הרצת קורס לא תואמת למבחן")
    if not catalog_item_visible_to_teacher(exam, offering.teacher_id):
        raise HTTPException(status_code=403, detail="אין הרשאה למבחן זה")
    if not catalog_item_matches_offering(exam, offering):
        widen_scope_for_offering(exam, offering)
    if not catalog_item_matches_offering(exam, offering):
        raise HTTPException(status_code=400, detail="לא ניתן להוסיף מבחן זה לקבוצה")
    await ensure_draft_session(exam_id, body.offering_id, db)
    await db.commit()
    await db.refresh(exam)
    cnt = await db.scalar(
        select(func.count()).select_from(Question).where(Question.exam_id == exam_id)
    )
    names = await load_scope_teacher_names(db, [exam])
    can_delete = not await exam_has_non_draft_sessions(exam_id, db)
    return _exam_response(exam, cnt or 0, names, can_delete=can_delete)


@router.delete("/{exam_id}", status_code=204)
async def delete_exam(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    await _get_teacher_exam(exam_id, user, db)
    if await exam_has_non_draft_sessions(exam_id, db):
        raise HTTPException(status_code=400, detail="לא ניתן למחוק — המבחן הופעל בעבר")
    await delete_exam_cascade(exam_id, db)
    await db.commit()


@router.get("/{exam_id}", response_model=ExamDetailResponse)
async def get_exam_detail(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    exam = await _get_teacher_exam(exam_id, user, db)
    q_result = await db.execute(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.exam_id == exam_id)
        .order_by(Question.order_index, Question.id)
    )
    questions = q_result.scalars().all()
    names = await load_scope_teacher_names(db, [exam])
    editable = not await exam_has_active_sessions(exam_id, db)
    can_delete = not await exam_has_non_draft_sessions(exam_id, db)
    catalog = await db.get(CourseCatalog, exam.catalog_course_id)
    return ExamDetailResponse(
        **_exam_response(exam, len(questions), names, can_delete=can_delete).model_dump(),
        catalog_course_name=catalog.name if catalog else "",
        questions=[QuestionResponse.model_validate(q) for q in questions],
        is_editable=editable,
    )


@router.get("/{exam_id}/pdf")
async def download_exam_pdf(
    exam_id: int,
    include_answers: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    exam = await _get_teacher_exam(exam_id, user, db)
    q_result = await db.execute(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.exam_id == exam_id)
        .order_by(Question.order_index, Question.id)
    )
    questions = q_result.scalars().all()
    if not questions:
        raise HTTPException(status_code=400, detail="אין שאלות במבחן")
    catalog = await db.get(CourseCatalog, exam.catalog_course_id)
    course_name = catalog.name if catalog else ""
    try:
        pdf_bytes = build_exam_pdf_bytes(exam, questions, course_name, include_answers=include_answers)
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="לא ניתן ליצור PDF — חסרה גופן במערכת")
    filename = pdf_content_disposition(exam)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": filename},
    )


@router.post("/{exam_id}/questions/import", response_model=QuestionsImportResponse)
async def import_questions(
    exam_id: int,
    body: QuestionsImportRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    exam = await _get_teacher_exam(exam_id, user, db)
    if await exam_has_active_sessions(exam_id, db):
        raise HTTPException(status_code=400, detail="לא ניתן לערוך מבחן פעיל")
    if body.questions_language is not None:
        exam.questions_language = body.questions_language

    start_idx = await next_question_order_index(exam_id, db)
    created: list[Question] = []
    for i, q in enumerate(body.questions):
        validate_question_body(q, i)
        question = await persist_question(exam_id, q, start_idx + i, db)
        created.append(question)

    await db.commit()
    out: list[QuestionResponse] = []
    for question in created:
        result = await db.execute(
            select(Question)
            .options(selectinload(Question.options))
            .where(Question.id == question.id)
        )
        out.append(QuestionResponse.model_validate(result.scalar_one()))
    return QuestionsImportResponse(imported_count=len(out), questions=out)


@router.post("/{exam_id}/questions/generate", response_model=GeminiGenerateQuestionsResponse)
async def generate_questions_draft(
    exam_id: int,
    body: GeminiGenerateQuestionsRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    exam = await _get_teacher_exam(exam_id, user, db)
    if await exam_has_active_sessions(exam_id, db):
        raise HTTPException(status_code=400, detail="לא ניתן לערוך מבחן פעיל")
    raw_text = await generate_exam_questions_text(body.series, exam.title)
    return GeminiGenerateQuestionsResponse(raw_text=raw_text)


@router.post("/{exam_id}/questions", response_model=QuestionResponse)
async def add_question(
    exam_id: int,
    body: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    exam = await _get_teacher_exam(exam_id, user, db)
    if await exam_has_active_sessions(exam_id, db):
        raise HTTPException(status_code=400, detail="לא ניתן לערוך מבחן פעיל")
    order_index = body.order_index if body.order_index else await next_question_order_index(exam_id, db)
    validate_question_body(body, 0)
    question = await persist_question(exam_id, body, order_index, db)
    await db.commit()
    result = await db.execute(
        select(Question).options(selectinload(Question.options)).where(Question.id == question.id)
    )
    q = result.scalar_one()
    return QuestionResponse.model_validate(q)


@router.put("/{exam_id}/questions/reorder", response_model=ExamDetailResponse)
async def reorder_exam_questions(
    exam_id: int,
    body: QuestionsReorderRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    await _get_teacher_exam(exam_id, user, db)
    if await exam_has_active_sessions(exam_id, db):
        raise HTTPException(status_code=400, detail="לא ניתן לערוך מבחן פעיל")
    await reorder_questions(exam_id, body.question_ids, db)
    await db.commit()
    return await get_exam_detail(exam_id, db, user)


@router.patch("/{exam_id}/questions/{question_id}", response_model=QuestionResponse)
async def edit_question(
    exam_id: int,
    question_id: int,
    body: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    await _get_teacher_exam(exam_id, user, db)
    if await exam_has_active_sessions(exam_id, db):
        raise HTTPException(status_code=400, detail="לא ניתן לערוך מבחן פעיל")
    await update_question(exam_id, question_id, body, db)
    await db.commit()
    result = await db.execute(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.id == question_id)
    )
    q = result.scalar_one()
    return QuestionResponse.model_validate(q)


@router.delete("/{exam_id}/questions/{question_id}", status_code=204)
async def remove_question(
    exam_id: int,
    question_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    await _get_teacher_exam(exam_id, user, db)
    if await exam_has_active_sessions(exam_id, db):
        raise HTTPException(status_code=400, detail="לא ניתן לערוך מבחן פעיל")
    await delete_question(exam_id, question_id, db)
    await db.commit()


@router.post("/{exam_id}/activate", response_model=ExamSessionResponse)
async def activate_exam(
    exam_id: int,
    body: ExamSessionActivate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    exam = await db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="מבחן לא נמצא")
    if not catalog_item_visible_to_teacher(exam, user.id):
        raise HTTPException(status_code=403, detail="אין הרשאה להפעיל מבחן זה")
    offering = await db.execute(
        select(CourseOffering)
        .options(selectinload(CourseOffering.catalog_course))
        .where(
            CourseOffering.id == body.offering_id,
            CourseOffering.teacher_id == user.id,
            CourseOffering.catalog_course_id == exam.catalog_course_id,
        )
    )
    offering_obj = offering.scalar_one_or_none()
    if not offering_obj:
        raise HTTPException(status_code=400, detail="הרצת קורס לא תואמת למבחן")
    if not catalog_item_matches_offering(exam, offering_obj):
        raise HTTPException(status_code=400, detail="המבחן לא מיועד להרצה זו (היקף/הרשאות)")

    result = await db.execute(
        select(ExamSession).where(
            ExamSession.exam_id == exam_id,
            ExamSession.offering_id == body.offering_id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        session = ExamSession(
            exam_id=exam_id,
            offering_id=body.offering_id,
            status=ExamStatus.DRAFT,
        )
        db.add(session)
    elif session.status != ExamStatus.DRAFT:
        raise HTTPException(status_code=400, detail="המבחן כבר הופעל")
    if body.duration_minutes is not None:
        exam.duration_minutes = body.duration_minutes
    if body.warning_minutes is not None:
        exam.warning_minutes = body.warning_minutes
    if body.auto_submit_on_timeout is not None:
        exam.auto_submit_on_timeout = body.auto_submit_on_timeout
    session.status = ExamStatus.ACTIVE
    session.activated_at = datetime.now(timezone.utc)
    session.integrity_mode_enabled = body.integrity_mode_enabled
    await db.flush()

    enrollments = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.offering_id == body.offering_id,
            CourseEnrollment.status == EnrollmentStatus.APPROVED,
        )
    )
    for enr in enrollments.scalars().all():
        db.add(
            Notification(
                user_id=enr.student_id,
                type=NotificationType.EXAM_AVAILABLE,
                title="מבחן חדש זמין",
                body=exam.title,
                related_exam_id=exam.id,
                related_offering_id=body.offering_id,
            )
        )
    await db.commit()
    await db.refresh(session)
    cnt = await db.scalar(
        select(func.count()).select_from(Question).where(Question.exam_id == exam.id)
    )
    result = await db.execute(
        select(ExamSession)
        .options(
            selectinload(ExamSession.exam),
            selectinload(ExamSession.offering).selectinload(CourseOffering.catalog_course),
        )
        .where(ExamSession.id == session.id)
    )
    return _session_response(result.scalar_one(), cnt or 0)


@router.get("/sessions/{session_id}/results", response_model=ExamSessionResultsResponse)
async def get_session_results(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    if user.role == UserRole.TEACHER:
        session = await _get_teacher_session(session_id, user, db)
    else:
        result = await db.execute(
            select(ExamSession)
            .options(
                selectinload(ExamSession.exam),
                selectinload(ExamSession.offering).selectinload(CourseOffering.catalog_course),
            )
            .where(ExamSession.id == session_id)
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="מפגש מבחן לא נמצא")

    enrollments = (
        await db.execute(
            select(CourseEnrollment)
            .options(selectinload(CourseEnrollment.student))
            .where(
                CourseEnrollment.offering_id == session.offering_id,
                CourseEnrollment.status == EnrollmentStatus.APPROVED,
            )
            .order_by(CourseEnrollment.id)
        )
    ).scalars().all()

    attempts = (
        await db.execute(
            select(StudentExamAttempt).where(StudentExamAttempt.exam_session_id == session_id)
        )
    ).scalars().all()
    attempt_by_student = {a.student_id: a for a in attempts}

    rows: list[StudentExamResultRow] = []
    for enr in enrollments:
        student = enr.student
        attempt = attempt_by_student.get(student.id)
        if attempt is None:
            status = "not_started"
        elif attempt.submitted_at is not None:
            status = "submitted"
        elif attempt.started_at is not None:
            status = "in_progress"
        else:
            status = "not_started"
        integrity_stats = None
        if session.integrity_mode_enabled and attempt:
            integrity_stats = (attempt.focus_loss_count, attempt.total_hidden_seconds)
        rows.append(
            StudentExamResultRow(
                student_id=student.id,
                student_name=student.full_name,
                student_number=student.student_id,
                attempt_id=attempt.id if attempt else None,
                started_at=attempt.started_at if attempt else None,
                submitted_at=attempt.submitted_at if attempt else None,
                score=attempt.score if attempt else None,
                max_score=attempt.max_score if attempt else None,
                status=status,
                focus_loss_count=integrity_stats[0] if integrity_stats else None,
                total_hidden_seconds=integrity_stats[1] if integrity_stats else None,
            )
        )

    rows.sort(key=lambda r: (r.status != "submitted", r.student_name))
    offering = session.offering
    catalog_name = offering.catalog_course.name if offering.catalog_course else ""
    offering_label = f"{catalog_name} — {offering.group_name} ({offering.academic_year}, סמסטר {offering.semester})"

    return ExamSessionResultsResponse(
        session_id=session.id,
        exam_id=session.exam_id,
        exam_title=session.exam.title,
        offering_label=offering_label,
        integrity_mode_enabled=session.integrity_mode_enabled,
        results=rows,
    )


@router.post("/sessions/{session_id}/close", response_model=ExamSessionResponse)
async def close_exam_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    session = await _get_teacher_session(session_id, user, db)
    if session.status == ExamStatus.DRAFT:
        raise HTTPException(status_code=400, detail="המבחן לא הופעל")
    if session.results_published:
        raise HTTPException(status_code=400, detail="התוצאות כבר פורסמו")
    session.status = ExamStatus.CLOSED
    if not session.closed_at:
        session.closed_at = datetime.now(timezone.utc)
    session.results_published = True
    await db.commit()
    cnt = await db.scalar(
        select(func.count()).select_from(Question).where(Question.exam_id == session.exam_id)
    )
    return _session_response(session, cnt or 0)


@router.post("/sessions/{session_id}/deactivate", response_model=ExamSessionResponse)
async def deactivate_exam_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    """Ferme les nouvelles soumissions ; les élèves déjà en cours peuvent encore rendre."""
    session = await _get_teacher_session(session_id, user, db)
    if session.status != ExamStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="המבחן אינו פעיל")
    session.status = ExamStatus.CLOSED
    session.closed_at = datetime.now(timezone.utc)
    session.results_published = False
    await db.commit()
    cnt = await db.scalar(
        select(func.count()).select_from(Question).where(Question.exam_id == session.exam_id)
    )
    return _session_response(session, cnt or 0)


@router.post("/sessions/{session_id}/reopen", response_model=ExamSessionResponse)
async def reopen_exam_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    """Rouvre un mבחן fermé — seuls les élèves sans copie rendue peuvent participer."""
    session = await _get_teacher_session(session_id, user, db)
    if session.status != ExamStatus.CLOSED:
        raise HTTPException(status_code=400, detail="המבחן לא סגור")
    exam = session.exam
    session.status = ExamStatus.ACTIVE
    session.closed_at = None
    session.results_published = False
    await notify_exam_available_to_pending_students(session, exam, db)
    await db.commit()
    cnt = await db.scalar(
        select(func.count()).select_from(Question).where(Question.exam_id == session.exam_id)
    )
    return _session_response(session, cnt or 0)


@router.post("/sessions/{session_id}/open", response_model=AttemptResponse)
async def open_exam_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    session = await _get_student_active_session(session_id, user, db)
    attempt = await _ensure_attempt_started(session, user, db)
    await db.commit()
    await db.refresh(attempt)
    return _attempt_response(attempt, session.exam.id)


@router.get("/sessions/{session_id}/take", response_model=ExamTakeResponse)
async def take_exam_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    session = await _get_student_session(session_id, user, db)
    exam = session.exam
    attempt_result = await db.execute(
        select(StudentExamAttempt).where(
            StudentExamAttempt.exam_session_id == session.id,
            StudentExamAttempt.student_id == user.id,
        )
    )
    existing = attempt_result.scalar_one_or_none()
    if existing and existing.submitted_at and not existing.can_resubmit:
        return ExamTakeResponse(
            **_take_meta(session, exam),
            attempt=_attempt_response(existing, exam.id),
            questions=[],
        )

    if not session_allows_student_work(session, existing):
        raise HTTPException(status_code=400, detail="המבחן לא פעיל")

    if rules_blocking(session, existing):
        attempt = await ensure_attempt_record(session, user, db)
        await db.commit()
        await db.refresh(attempt)
        return ExamTakeResponse(
            **_take_meta(session, exam),
            integrity_mode_enabled=True,
            attempt=_attempt_response(attempt, exam.id),
            questions=[],
        )

    attempt = await _ensure_attempt_started(session, user, db)
    attempt = await auto_submit_if_expired(attempt, session, exam, db)
    q_result = await db.execute(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.exam_id == exam.id)
        .order_by(Question.order_index, Question.id)
    )
    questions = list(q_result.scalars().all())
    await db.commit()
    await db.refresh(attempt)
    paper = [] if attempt.submitted_at else _student_paper(exam, questions, attempt.id)
    saved = [] if attempt.submitted_at else await _saved_answers_for_attempt(attempt.id, db)
    return ExamTakeResponse(
        **_take_meta(session, exam),
        attempt=_attempt_response(attempt, exam.id),
        questions=paper,
        saved_answers=saved,
    )


@router.put("/sessions/{session_id}/answers")
async def save_session_answers(
    session_id: int,
    body: SubmitExamRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    session = await _get_student_session(session_id, user, db)
    attempt_result = await db.execute(
        select(StudentExamAttempt).where(
            StudentExamAttempt.exam_session_id == session.id,
            StudentExamAttempt.student_id == user.id,
        )
    )
    attempt = attempt_result.scalar_one_or_none()
    if not session_allows_student_work(session, attempt):
        raise HTTPException(status_code=400, detail="המבחן לא פעיל")
    if not attempt or not attempt.started_at:
        raise HTTPException(status_code=400, detail="לא התחלת את המבחן")
    exam = session.exam
    if session.integrity_mode_enabled and not attempt.rules_accepted_at:
        raise HTTPException(status_code=400, detail="יש לאשר את כללי המבחן")
    await save_draft_answers(attempt, exam, body.answers, db)
    await db.commit()
    return {"ok": True}


@router.post("/sessions/{session_id}/accept-rules", response_model=AttemptResponse)
async def accept_exam_rules(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    session = await _get_student_active_session(session_id, user, db)
    attempt = await accept_rules(session, user, db)
    attempt = await _ensure_attempt_started(session, user, db)
    await db.commit()
    await db.refresh(attempt)
    return _attempt_response(attempt, session.exam_id)


@router.post("/attempts/{attempt_id}/integrity-events", response_model=AttemptResponse)
async def log_integrity_events(
    attempt_id: int,
    body: IntegrityEventsRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    attempt = await get_owned_attempt(attempt_id, user, db)
    session = await db.get(ExamSession, attempt.exam_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="מבחן לא נמצא")
    attempt = await record_events(attempt, session, body.events, db)
    await db.commit()
    await db.refresh(attempt)
    return _attempt_response(attempt, session.exam_id)


@router.post("/sessions/{session_id}/submit", response_model=AttemptResponse)
async def submit_exam_session(
    session_id: int,
    body: SubmitExamRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    result = await db.execute(
        select(ExamSession)
        .options(selectinload(ExamSession.exam))
        .where(ExamSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="מבחן לא נמצא")
    exam = session.exam
    attempt_result = await db.execute(
        select(StudentExamAttempt).where(
            StudentExamAttempt.exam_session_id == session_id,
            StudentExamAttempt.student_id == user.id,
        )
    )
    attempt = attempt_result.scalar_one_or_none()
    if not attempt or not attempt.started_at:
        raise HTTPException(status_code=400, detail="לא התחלת את המבחן")
    if attempt.submitted_at and not attempt.can_resubmit:
        raise HTTPException(status_code=400, detail="כבר הוגש")
    if session.results_published:
        raise HTTPException(status_code=400, detail="המבחן נסגר")
    if not session_allows_student_work(session, attempt):
        raise HTTPException(status_code=400, detail="המבחן לא פעיל")
    if session.integrity_mode_enabled and not attempt.rules_accepted_at:
        raise HTTPException(status_code=400, detail="יש לאשר את כללי המבחן")
    now = datetime.now(timezone.utc)
    if attempt.expires_at and now > attempt.expires_at and not exam.auto_submit_on_timeout:
        raise HTTPException(status_code=400, detail="הזמן נגמר")
    await finalize_exam_submission(attempt, session, exam, body.answers, db)
    await db.commit()
    await db.refresh(attempt)
    return _attempt_response(attempt, exam.id)


@router.get("/sessions/{session_id}/review", response_model=ExamReviewResponse)
async def get_session_review(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    session = await _get_student_session(session_id, user, db)
    exam = session.exam
    attempt_result = await db.execute(
        select(StudentExamAttempt).where(
            StudentExamAttempt.exam_session_id == session.id,
            StudentExamAttempt.student_id == user.id,
        )
    )
    attempt = attempt_result.scalar_one_or_none()
    if not attempt or not attempt.submitted_at:
        raise HTTPException(status_code=400, detail="המבחן טרם הוגש")

    attempt_resp = _attempt_response(attempt, exam.id)
    if not exam.show_detailed_correction:
        return ExamReviewResponse(
            session_id=session.id,
            exam_title=exam.title,
            show_correction=False,
            questions_language=exam.questions_language,
            attempt=attempt_resp,
            questions=[],
        )

    questions_list = await _load_exam_questions(exam.id, db)
    answers_result = await db.execute(select(Answer).where(Answer.attempt_id == attempt.id))
    answers_by_q = {
        a.question_id: list(a.selected_option_ids or []) for a in answers_result.scalars().all()
    }
    review_rows = _build_review_rows(exam, questions_list, attempt.id, answers_by_q)

    return ExamReviewResponse(
        session_id=session.id,
        exam_title=exam.title,
        show_correction=True,
        questions_language=exam.questions_language,
        attempt=attempt_resp,
        questions=review_rows,
    )


@router.post("/sessions/{session_id}/practice/start", response_model=AttemptResponse)
async def start_practice_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    session = await _get_student_session(session_id, user, db)
    attempt = await get_submitted_attempt(session_id, user.id, db)
    attempt = await start_practice(attempt, db)
    await db.commit()
    await db.refresh(attempt)
    return _attempt_response(attempt, session.exam_id)


@router.get("/sessions/{session_id}/practice/take", response_model=ExamTakeResponse)
async def take_practice_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    session = await _get_student_session(session_id, user, db)
    exam = session.exam
    attempt = await get_submitted_attempt(session_id, user.id, db)
    if not attempt.practice_active:
        raise HTTPException(status_code=400, detail="אין תרגול פעיל")
    questions_list = await _load_exam_questions(exam.id, db)
    saved_map = await practice_answers_map(attempt.id, db)
    paper = _practice_paper(exam, questions_list, attempt.id)
    saved = [
        SavedAnswerDraft(question_id=qid, selected_option_ids=ids)
        for qid, ids in saved_map.items()
    ]
    meta = _take_meta(session, exam)
    meta["integrity_mode_enabled"] = False
    meta["auto_submit_on_timeout"] = False
    return ExamTakeResponse(
        **meta,
        attempt=_attempt_response(attempt, exam.id),
        questions=paper,
        saved_answers=saved,
    )


@router.put("/sessions/{session_id}/practice/answers")
async def save_practice_session_answers(
    session_id: int,
    body: SubmitExamRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    session = await _get_student_session(session_id, user, db)
    attempt = await get_submitted_attempt(session_id, user.id, db)
    await save_practice_answers(attempt, session.exam, body.answers, db)
    await db.commit()
    return {"ok": True}


@router.post("/sessions/{session_id}/practice/submit", response_model=AttemptResponse)
async def submit_practice_session(
    session_id: int,
    body: SubmitExamRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    session = await _get_student_session(session_id, user, db)
    attempt = await get_submitted_attempt(session_id, user.id, db)
    attempt = await finalize_practice_submission(attempt, session.exam, body.answers, db)
    await db.commit()
    await db.refresh(attempt)
    return _attempt_response(attempt, session.exam_id)


@router.get("/sessions/{session_id}/practice/history", response_model=list[PracticeResultResponse])
async def get_practice_history(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    attempt = await get_submitted_attempt(session_id, user.id, db)
    rows = await list_practice_results(attempt.id, db)
    return [PracticeResultResponse.model_validate(r) for r in rows]


@router.get("/sessions/{session_id}/practice/review", response_model=ExamReviewResponse)
async def get_practice_review(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    session = await _get_student_session(session_id, user, db)
    exam = session.exam
    attempt = await get_submitted_attempt(session_id, user.id, db)
    if not attempt.practice_submitted_at:
        raise HTTPException(status_code=400, detail="טרם הושלם תרגול")
    attempt_resp = _attempt_response(attempt, exam.id)
    if not exam.show_detailed_correction:
        return ExamReviewResponse(
            session_id=session.id,
            exam_title=exam.title,
            show_correction=False,
            questions_language=exam.questions_language,
            attempt=attempt_resp,
            questions=[],
            for_practice=True,
        )
    questions_list = await _load_exam_questions(exam.id, db)
    selected_by_q = await practice_answers_map(attempt.id, db)
    review_rows = _build_review_rows(
        exam, questions_list, attempt.id, selected_by_q, practice_order=True
    )
    return ExamReviewResponse(
        session_id=session.id,
        exam_title=exam.title,
        show_correction=True,
        questions_language=exam.questions_language,
        attempt=attempt_resp,
        questions=review_rows,
        for_practice=True,
    )


@router.get("/sessions/{session_id}/my-attempt", response_model=AttemptResponse | None)
async def my_session_attempt(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    result = await db.execute(
        select(StudentExamAttempt)
        .options(selectinload(StudentExamAttempt.exam_session).selectinload(ExamSession.exam))
        .where(
            StudentExamAttempt.exam_session_id == session_id,
            StudentExamAttempt.student_id == user.id,
        )
    )
    attempt = result.scalar_one_or_none()
    if not attempt:
        return None
    return _attempt_response(attempt, attempt.exam_session.exam_id)
