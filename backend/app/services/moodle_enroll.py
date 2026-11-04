"""Inscription approuvée des élèves déjà connus, rapprochés par e-mail."""

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.moodle.parse import MoodleStudent
from app.models.course import CourseEnrollment, CourseOffering
from app.models.enums import EnrollmentStatus, NotificationType, UserRole
from app.models.moodle import MoodleUserLink
from app.models.notification import Notification
from app.models.user import User
from app.schemas.moodle import MoodleSkippedStudent
from app.services.enrollment_service import (
    ensure_no_sibling_enrollment_conflict,
    find_sibling_enrollment,
    reject_sibling_pending_enrollments,
)


async def students_by_email(db: AsyncSession, emails: list[str]) -> dict[str, User]:
    keys = {email.strip().lower() for email in emails if email.strip()}
    if not keys:
        return {}
    result = await db.execute(
        select(User).where(User.role == UserRole.STUDENT, func.lower(User.email).in_(keys))
    )
    return {user.email.lower(): user for user in result.scalars()}


async def enroll_matched(
    db: AsyncSession,
    teacher_id: int,
    offering: CourseOffering,
    matched: list[tuple[int, MoodleStudent]],
    users_by_id: dict[int, User],
) -> tuple[int, int, list[MoodleSkippedStudent]]:
    enrolled = already = 0
    skipped: list[MoodleSkippedStudent] = []
    for user_id, student in matched:
        await _upsert_user_link(db, teacher_id, user_id, student.moodle_id)
        try:
            outcome = await approve_known_student(db, offering, users_by_id[user_id])
        except HTTPException as exc:
            skipped.append(
                MoodleSkippedStudent(
                    email=student.email, fullname=student.fullname, reason=str(exc.detail)
                )
            )
            continue
        if outcome == "already":
            already += 1
        else:
            enrolled += 1
    return enrolled, already, skipped


async def approve_known_student(db: AsyncSession, offering: CourseOffering, student: User) -> str:
    sibling = await find_sibling_enrollment(db, student.id, offering)
    if sibling and sibling.status == EnrollmentStatus.APPROVED:
        ensure_no_sibling_enrollment_conflict(sibling)
    await reject_sibling_pending_enrollments(db, student.id, offering)
    existing = await _enrollment(db, offering.id, student.id)
    if existing and existing.status == EnrollmentStatus.APPROVED:
        return "already"
    if existing:
        existing.status = EnrollmentStatus.APPROVED
    else:
        db.add(
            CourseEnrollment(
                offering_id=offering.id, student_id=student.id, status=EnrollmentStatus.APPROVED
            )
        )
    _notify(db, student.id, offering.id)
    return "enrolled"


async def _upsert_user_link(
    db: AsyncSession, teacher_id: int, user_id: int, moodle_user_id: int
) -> None:
    by_user = await _link(db, MoodleUserLink.user_id, teacher_id, user_id)
    by_moodle = await _link(db, MoodleUserLink.moodle_user_id, teacher_id, moodle_user_id)
    if by_moodle is not None and by_moodle.user_id != user_id:
        await db.delete(by_moodle)
        await db.flush()
    if by_user is None:
        db.add(
            MoodleUserLink(teacher_id=teacher_id, user_id=user_id, moodle_user_id=moodle_user_id)
        )
        return
    by_user.moodle_user_id = moodle_user_id


async def _link(db: AsyncSession, column, teacher_id: int, value: int) -> MoodleUserLink | None:
    return await db.scalar(
        select(MoodleUserLink).where(MoodleUserLink.teacher_id == teacher_id, column == value)
    )


async def _enrollment(
    db: AsyncSession, offering_id: int, student_id: int
) -> CourseEnrollment | None:
    return await db.scalar(
        select(CourseEnrollment).where(
            CourseEnrollment.offering_id == offering_id,
            CourseEnrollment.student_id == student_id,
        )
    )


def _notify(db: AsyncSession, student_id: int, offering_id: int) -> None:
    db.add(
        Notification(
            user_id=student_id,
            type=NotificationType.ENROLLMENT_APPROVED,
            title="נרשמת לקורס",
            body="נוספת לקורס על ידי המורה",
            related_offering_id=offering_id,
        )
    )
