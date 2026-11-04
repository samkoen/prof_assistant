from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.moodle import (
    MoodleAssignmentSelect,
    MoodleAssignmentsView,
    MoodleConnectionSave,
    MoodleConnectionStatus,
    MoodleCourseImport,
    MoodleCourseItem,
    MoodleGradePushResult,
    MoodleImportCourseResult,
    MoodleStudentImportResult,
)
from app.services.moodle_connection import connection_status, save_connection
from app.services.moodle_sync import (
    assignment_view,
    import_moodle_course,
    import_moodle_students,
    list_moodle_courses,
    push_session_grades,
    select_assignment,
)

router = APIRouter(prefix="/moodle", tags=["moodle"])


@router.get("/connection", response_model=MoodleConnectionStatus)
async def get_moodle_connection(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    return await connection_status(db, user.id)


@router.put("/connection", response_model=MoodleConnectionStatus)
async def put_moodle_connection(
    body: MoodleConnectionSave,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    return await save_connection(db, user, body.base_url, body.token)


@router.get("/courses", response_model=list[MoodleCourseItem])
async def get_moodle_courses(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    return await list_moodle_courses(db, user)


@router.post("/courses/import", response_model=MoodleImportCourseResult)
async def post_moodle_course_import(
    body: MoodleCourseImport,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    return await import_moodle_course(db, user, body.moodle_course_id, body.offering_id)


@router.post("/offerings/{offering_id}/students", response_model=MoodleStudentImportResult)
async def post_moodle_students(
    offering_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    return await import_moodle_students(db, user, offering_id)


@router.get("/sessions/{session_id}/assignments", response_model=MoodleAssignmentsView)
async def get_moodle_assignments(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    return await assignment_view(db, user, session_id)


@router.put("/sessions/{session_id}/assignment", response_model=MoodleAssignmentsView)
async def put_moodle_assignment(
    session_id: int,
    body: MoodleAssignmentSelect,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    return await select_assignment(db, user, session_id, body.moodle_assign_id)


@router.post("/sessions/{session_id}/grades", response_model=MoodleGradePushResult)
async def post_moodle_grades(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    return await push_session_grades(db, user, session_id)
