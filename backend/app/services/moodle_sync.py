"""Synchro Moodle : cours, élèves, devoir et envoi des notes."""

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.moodle.client import push_assignment_grades
from app.integrations.moodle.grades import AttemptGrade, build_grade_payload
from app.integrations.moodle.parse import (
    MoodleApiError,
    MoodleCourse,
    match_students_by_email,
    parse_assignments,
    parse_courses,
    parse_students,
)
from app.models.course import CourseOffering
from app.models.exam import ExamSession, StudentExamAttempt
from app.models.moodle import MoodleCourseLink, MoodleGradeLink, MoodleUserLink
from app.models.user import User
from app.schemas.moodle import (
    MoodleAssignmentItem,
    MoodleAssignmentsView,
    MoodleCourseItem,
    MoodleGradePushResult,
    MoodleGradeSkip,
    MoodleImportCourseResult,
    MoodleStudentImportResult,
    MoodleUnknownStudent,
)
from app.services.moodle_connection import moodle_call, require_credentials
from app.services.moodle_enroll import enroll_matched, students_by_email
from app.services.moodle_offering import create_offering_from_moodle
from app.services.offering_access import (
    offering_managed_by_clause,
    require_teacher_manages_offering,
)


async def list_moodle_courses(db: AsyncSession, teacher: User) -> list[MoodleCourseItem]:
    base_url, token, moodle_user_id = await require_credentials(db, teacher.id)
    payload = await moodle_call(
        base_url, token, "core_enrol_get_users_courses", [("userid", str(moodle_user_id))]
    )
    links = await links_by_course(db, teacher.id)
    return [_course_item(course, links) for course in parse_courses(payload)]


async def import_moodle_course(
    db: AsyncSession, teacher: User, moodle_course_id: int, offering_id: int | None
) -> MoodleImportCourseResult:
    course = await _remote_course(db, teacher, moodle_course_id)
    existing = await find_teacher_link(db, teacher.id, course.id)
    if offering_id is None and existing is not None:
        return MoodleImportCourseResult(
            offering_id=existing.offering_id, moodle_course_id=course.id, created=False
        )
    offering, created = await _target_offering(db, teacher, course, offering_id)
    await attach_course_link(db, teacher.id, offering, course.id)
    await db.commit()
    return MoodleImportCourseResult(
        offering_id=offering.id, moodle_course_id=course.id, created=created
    )


async def import_moodle_students(
    db: AsyncSession, teacher: User, offering_id: int
) -> MoodleStudentImportResult:
    offering = await require_teacher_manages_offering(db, offering_id, teacher.id)
    link = await _course_link(db, offering.id)
    base_url, token, _user_id = await require_credentials(db, teacher.id)
    payload = await moodle_call(
        base_url, token, "core_enrol_get_enrolled_users", [("courseid", str(link.moodle_course_id))]
    )
    students = parse_students(payload)
    users = await students_by_email(db, [student.email for student in students])
    matched, unknown = match_students_by_email(
        students, {email: user.id for email, user in users.items()}
    )
    enrolled, already, skipped = await enroll_matched(
        db, teacher.id, offering, matched, {user.id: user for user in users.values()}
    )
    await db.commit()
    return _student_result(enrolled, already, unknown, skipped)


async def assignment_view(
    db: AsyncSession, teacher: User, session_id: int
) -> MoodleAssignmentsView:
    session = await _session(db, teacher.id, session_id)
    link = await _optional_course_link(db, session.offering_id)
    selected = await _grade_link(db, session.id)
    if link is None:
        return MoodleAssignmentsView(linked=False)
    assignments = await _assignments(db, teacher, link.moodle_course_id)
    selected_id = selected.moodle_assign_id if selected else None
    return _assignments_view(link.moodle_course_id, assignments, selected_id)


async def select_assignment(
    db: AsyncSession, teacher: User, session_id: int, assign_id: int
) -> MoodleAssignmentsView:
    view = await assignment_view(db, teacher, session_id)
    if not view.linked:
        raise HTTPException(status_code=400, detail="הקורס אינו משויך ל-Moodle")
    if assign_id not in {item.id for item in view.assignments}:
        raise HTTPException(status_code=400, detail="המטלה לא נמצאה בקורס")
    await _save_grade_link(db, session_id, assign_id)
    await db.commit()
    view.selected_assign_id = assign_id
    return view


async def push_session_grades(
    db: AsyncSession, teacher: User, session_id: int
) -> MoodleGradePushResult:
    session = await _session(db, teacher.id, session_id)
    link = await _course_link(db, session.offering_id)
    grade_link = await _grade_link(db, session.id)
    if grade_link is None:
        raise HTTPException(status_code=400, detail="יש לבחור מטלה ב-Moodle")
    chosen = await _chosen_assignment(
        db, teacher, link.moodle_course_id, grade_link.moodle_assign_id
    )
    sent, skipped = await _push(db, teacher, session.id, chosen.id, chosen.grade_max)
    return MoodleGradePushResult(
        sent=sent,
        skipped=[
            MoodleGradeSkip(student_name=item.student_name, reason=item.reason) for item in skipped
        ],
    )


async def links_by_course(db: AsyncSession, teacher_id: int) -> dict[int, int]:
    rows = await db.execute(
        select(MoodleCourseLink.moodle_course_id, MoodleCourseLink.offering_id)
        .join(CourseOffering, MoodleCourseLink.offering_id == CourseOffering.id)
        .where(offering_managed_by_clause(teacher_id))
    )
    return {course_id: offering_id for course_id, offering_id in rows.all()}


async def find_teacher_link(
    db: AsyncSession, teacher_id: int, moodle_course_id: int
) -> MoodleCourseLink | None:
    return await db.scalar(
        select(MoodleCourseLink)
        .join(CourseOffering, MoodleCourseLink.offering_id == CourseOffering.id)
        .where(
            MoodleCourseLink.moodle_course_id == moodle_course_id,
            offering_managed_by_clause(teacher_id),
        )
    )


async def attach_course_link(
    db: AsyncSession, teacher_id: int, offering: CourseOffering, moodle_course_id: int
) -> None:
    current = await _optional_course_link(db, offering.id)
    other = await find_teacher_link(db, teacher_id, moodle_course_id)
    if other is not None and other.offering_id != offering.id:
        raise HTTPException(status_code=400, detail="קורס Moodle זה כבר משויך לקורס אחר")
    if current is not None and current.moodle_course_id != moodle_course_id:
        raise HTTPException(status_code=400, detail="הקורס המקומי כבר משויך ל-Moodle")
    if current is None:
        db.add(MoodleCourseLink(offering_id=offering.id, moodle_course_id=moodle_course_id))


def _course_item(course: MoodleCourse, links: dict[int, int]) -> MoodleCourseItem:
    return MoodleCourseItem(
        id=course.id,
        shortname=course.shortname,
        fullname=course.fullname,
        offering_id=links.get(course.id),
    )


async def _target_offering(
    db: AsyncSession, teacher: User, course: MoodleCourse, offering_id: int | None
) -> tuple[CourseOffering, bool]:
    if offering_id is None:
        return await create_offering_from_moodle(db, teacher.id, course), True
    return await require_teacher_manages_offering(db, offering_id, teacher.id), False


async def _remote_course(db: AsyncSession, teacher: User, moodle_course_id: int) -> MoodleCourse:
    base_url, token, moodle_user_id = await require_credentials(db, teacher.id)
    payload = await moodle_call(
        base_url, token, "core_enrol_get_users_courses", [("userid", str(moodle_user_id))]
    )
    for course in parse_courses(payload):
        if course.id == moodle_course_id:
            return course
    raise HTTPException(status_code=404, detail="הקורס לא נמצא ב-Moodle")


def _student_result(
    enrolled: int, already: int, unknown: list, skipped: list
) -> MoodleStudentImportResult:
    return MoodleStudentImportResult(
        enrolled=enrolled,
        already=already,
        unknown=[
            MoodleUnknownStudent(email=item.email, fullname=item.fullname) for item in unknown
        ],
        skipped=skipped,
    )


async def _session(db: AsyncSession, teacher_id: int, session_id: int) -> ExamSession:
    session = await db.get(ExamSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="מפגש מטלה לא נמצא")
    await require_teacher_manages_offering(db, session.offering_id, teacher_id)
    return session


async def _course_link(db: AsyncSession, offering_id: int) -> MoodleCourseLink:
    link = await _optional_course_link(db, offering_id)
    if link is None:
        raise HTTPException(status_code=400, detail="הקורס אינו משויך ל-Moodle")
    return link


async def _optional_course_link(db: AsyncSession, offering_id: int) -> MoodleCourseLink | None:
    return await db.scalar(
        select(MoodleCourseLink).where(MoodleCourseLink.offering_id == offering_id)
    )


async def _grade_link(db: AsyncSession, session_id: int) -> MoodleGradeLink | None:
    return await db.scalar(
        select(MoodleGradeLink).where(MoodleGradeLink.exam_session_id == session_id)
    )


async def _assignments(
    db: AsyncSession, teacher: User, moodle_course_id: int
) -> list[MoodleAssignmentItem]:
    base_url, token, _user_id = await require_credentials(db, teacher.id)
    payload = await moodle_call(
        base_url, token, "mod_assign_get_assignments", [("courseids[0]", str(moodle_course_id))]
    )
    return [
        MoodleAssignmentItem(id=item.id, name=item.name, grade_max=item.grade_max)
        for item in parse_assignments(payload, moodle_course_id)
    ]


def _assignments_view(
    course_id: int, assignments: list[MoodleAssignmentItem], selected_id: int | None
) -> MoodleAssignmentsView:
    return MoodleAssignmentsView(
        linked=True,
        moodle_course_id=course_id,
        assignments=assignments,
        selected_assign_id=selected_id,
    )


async def _save_grade_link(db: AsyncSession, session_id: int, assign_id: int) -> None:
    row = await _grade_link(db, session_id)
    if row is None:
        db.add(MoodleGradeLink(exam_session_id=session_id, moodle_assign_id=assign_id))
        return
    row.moodle_assign_id = assign_id


async def _chosen_assignment(
    db: AsyncSession, teacher: User, moodle_course_id: int, assign_id: int
) -> MoodleAssignmentItem:
    for item in await _assignments(db, teacher, moodle_course_id):
        if item.id == assign_id:
            return item
    raise HTTPException(status_code=400, detail="המטלה לא נמצאה בקורס")


async def _push(
    db: AsyncSession, teacher: User, session_id: int, assign_id: int, grade_max: float
) -> tuple[int, list]:
    attempts = await _attempt_grades(db, session_id)
    moodle_ids = await _moodle_user_ids(db, teacher.id, [item.student_id for item in attempts])
    sent, skipped = build_grade_payload(attempts, moodle_ids, grade_max)
    base_url, token, _user_id = await require_credentials(db, teacher.id)
    try:
        await push_assignment_grades(base_url, token, assign_id, sent)
    except MoodleApiError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return len(sent), skipped


async def _attempt_grades(db: AsyncSession, session_id: int) -> list[AttemptGrade]:
    rows = await db.execute(
        select(StudentExamAttempt, User)
        .join(User, User.id == StudentExamAttempt.student_id)
        .where(
            StudentExamAttempt.exam_session_id == session_id,
            StudentExamAttempt.submitted_at.is_not(None),
        )
    )
    return [
        AttemptGrade(
            student_id=user.id,
            student_name=user.full_name,
            score=attempt.score,
            max_score=attempt.max_score,
        )
        for attempt, user in rows.all()
    ]


async def _moodle_user_ids(
    db: AsyncSession, teacher_id: int, student_ids: list[int]
) -> dict[int, int]:
    if not student_ids:
        return {}
    rows = await db.execute(
        select(MoodleUserLink.user_id, MoodleUserLink.moodle_user_id).where(
            MoodleUserLink.teacher_id == teacher_id,
            MoodleUserLink.user_id.in_(student_ids),
        )
    )
    return {user_id: moodle_id for user_id, moodle_id in rows.all()}
