"""Routes משימה : sous-tâches, preuves, vérification professeur."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import UserRole
from app.models.exam import ExamSession, StudentExamAttempt
from app.models.user import User
from app.routers.exams import _get_student_session, _get_teacher_exam, _get_teacher_session
from app.schemas.task import (
    TaskReviewOut,
    TaskReviewPatch,
    TaskStepBody,
    TaskStepOut,
    TaskStepStudentOut,
    TaskStudentResult,
)
from app.services.ai_client import AiError
from app.services.exam_kind import is_task
from app.services.task_proofs import load_proof_bytes, proofs_by_step, save_proof, student_steps
from app.services.practice_release import withhold_student_grade, without_grades
from app.services.task_review import apply_teacher_review, load_board, verify_step
from app.services.task_service import add_step, delete_step, list_steps, update_step

router = APIRouter(prefix="/exams", tags=["tasks"])


def _require_task_exam(exam) -> None:
    if not is_task(exam):
        raise HTTPException(status_code=400, detail="זו אינה משימה")


async def _student_attempt(session: ExamSession, user: User, db: AsyncSession) -> StudentExamAttempt:
    row = await db.execute(
        select(StudentExamAttempt).where(
            StudentExamAttempt.exam_session_id == session.id,
            StudentExamAttempt.student_id == user.id,
        )
    )
    attempt = row.scalar_one_or_none()
    if not attempt or not attempt.started_at:
        raise HTTPException(status_code=400, detail="לא התחלת את המשימה")
    return attempt


@router.get("/{exam_id}/steps", response_model=list[TaskStepOut])
async def get_steps(exam_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))):
    exam = await _get_teacher_exam(exam_id, user, db)
    _require_task_exam(exam)
    return await list_steps(exam.id, db)


@router.post("/{exam_id}/steps", response_model=TaskStepOut)
async def post_step(exam_id: int, body: TaskStepBody, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))):
    exam = await _get_teacher_exam(exam_id, user, db)
    step = await add_step(exam, body, db)
    await db.commit()
    return step


@router.patch("/{exam_id}/steps/{step_id}", response_model=TaskStepOut)
async def patch_step(exam_id: int, step_id: int, body: TaskStepBody, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))):
    exam = await _get_teacher_exam(exam_id, user, db)
    step = await update_step(exam, step_id, body, db)
    await db.commit()
    return step


@router.delete("/{exam_id}/steps/{step_id}", status_code=204)
async def remove_step(exam_id: int, step_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))):
    exam = await _get_teacher_exam(exam_id, user, db)
    await delete_step(exam, step_id, db)
    await db.commit()


@router.get("/sessions/{session_id}/steps", response_model=list[TaskStepStudentOut])
async def get_student_steps(session_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(UserRole.STUDENT))):
    session = await _get_student_session(session_id, user, db)
    _require_task_exam(session.exam)
    attempt = await _student_attempt(session, user, db)
    steps = await list_steps(session.exam_id, db)
    proofs = await proofs_by_step(attempt.id, db)
    return student_steps(steps, proofs)


@router.post("/sessions/{session_id}/steps/{step_id}/proof", response_model=TaskStepStudentOut)
async def post_proof(session_id: int, step_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(UserRole.STUDENT))):
    session = await _get_student_session(session_id, user, db)
    _require_task_exam(session.exam)
    attempt = await _student_attempt(session, user, db)
    data = await file.read()
    proof = await save_proof(session.exam, attempt, step_id, file.filename or "proof", data, db)
    await db.commit()
    step = await list_steps(session.exam_id, db)
    match = next(item for item in step if item.id == step_id)
    return {**_step_dict(match), "proof_filename": proof.filename, "proof_ready": True}


def _step_dict(step) -> dict:
    return {"id": step.id, "order_index": step.order_index, "title": step.title, "instructions": step.instructions, "max_points": step.max_points}


@router.get("/sessions/{session_id}/steps/{step_id}/proof")
async def get_own_proof(session_id: int, step_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(UserRole.STUDENT))):
    session = await _get_student_session(session_id, user, db)
    attempt = await _student_attempt(session, user, db)
    return await _proof_response(attempt.id, step_id, db)


async def _student_task_result(session: ExamSession, attempt: StudentExamAttempt, db: AsyncSession) -> TaskStudentResult:
    if withhold_student_grade(session, attempt):
        steps = without_grades(await load_board(attempt, session.exam, db))
        return TaskStudentResult(published=True, grading_locked=True, steps=steps)
    if not session.results_published:
        return TaskStudentResult(published=False, steps=[])
    return TaskStudentResult(published=True, steps=await load_board(attempt, session.exam, db))


@router.get("/sessions/{session_id}/task-result", response_model=TaskStudentResult)
async def get_task_result(session_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(UserRole.STUDENT))):
    session = await _get_student_session(session_id, user, db)
    _require_task_exam(session.exam)
    attempt = await _student_attempt(session, user, db)
    if not attempt.submitted_at:
        raise HTTPException(status_code=400, detail="המשימה טרם הוגשה")
    return await _student_task_result(session, attempt, db)


@router.get("/sessions/{session_id}/attempts/{attempt_id}/task", response_model=list[TaskReviewOut])
async def get_teacher_task(session_id: int, attempt_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))):
    session, attempt = await _teacher_attempt(session_id, attempt_id, user, db)
    return await load_board(attempt, session.exam, db)


@router.post("/sessions/{session_id}/attempts/{attempt_id}/steps/{step_id}/verify", response_model=list[TaskReviewOut])
async def post_verify(session_id: int, attempt_id: int, step_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))):
    session, attempt = await _teacher_attempt(session_id, attempt_id, user, db)
    try:
        await verify_step(user, attempt, session.exam, step_id, db)
    except AiError as exc:
        raise HTTPException(status_code=502, detail="בדיקת ה-AI נכשלה") from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="בדיקת ה-AI נכשלה") from exc
    await db.commit()
    return await load_board(attempt, session.exam, db)


@router.patch("/sessions/{session_id}/attempts/{attempt_id}/steps/{step_id}", response_model=list[TaskReviewOut])
async def patch_review(session_id: int, attempt_id: int, step_id: int, body: TaskReviewPatch, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))):
    session, attempt = await _teacher_attempt(session_id, attempt_id, user, db)
    await apply_teacher_review(attempt, session.exam, step_id, body, db)
    await db.commit()
    return await load_board(attempt, session.exam, db)


@router.get("/sessions/{session_id}/attempts/{attempt_id}/steps/{step_id}/proof")
async def get_teacher_proof(session_id: int, attempt_id: int, step_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN))):
    _session, attempt = await _teacher_attempt(session_id, attempt_id, user, db)
    return await _proof_response(attempt.id, step_id, db)


async def _teacher_attempt(session_id: int, attempt_id: int, user: User, db: AsyncSession):
    session = await _get_teacher_session(session_id, user, db)
    _require_task_exam(session.exam)
    attempt = await db.get(StudentExamAttempt, attempt_id)
    if not attempt or attempt.exam_session_id != session.id:
        raise HTTPException(status_code=404, detail="הגשה לא נמצאה")
    return session, attempt


async def _proof_response(attempt_id: int, step_id: int, db: AsyncSession) -> Response:
    proof = await load_proof_bytes(attempt_id, step_id, db)
    return Response(content=proof.file_data, media_type=proof.mime_type, headers={"Content-Disposition": f'inline; filename="{proof.filename}"'})
