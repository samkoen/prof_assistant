from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import CourseEnrollment, CourseOffering
from app.models.exam import StudentExamAttempt
from app.models.enums import UserRole
from app.models.notification import Notification
from app.models.user import User
from app.services.exam_lifecycle import delete_attempt_records


async def delete_student_account(db: AsyncSession, student: User) -> None:
    attempts = (
        await db.execute(select(StudentExamAttempt).where(StudentExamAttempt.student_id == student.id))
    ).scalars()
    for attempt in attempts:
        await delete_attempt_records(attempt, db)

    enrollments = (
        await db.execute(select(CourseEnrollment).where(CourseEnrollment.student_id == student.id))
    ).scalars()
    for enrollment in enrollments:
        await db.delete(enrollment)

    notifications = (
        await db.execute(select(Notification).where(Notification.user_id == student.id))
    ).scalars()
    for notification in notifications:
        await db.delete(notification)

    await db.delete(student)


async def enrolled_student_ids_for_teacher(db: AsyncSession, teacher_id: int) -> set[int]:
    result = await db.execute(
        select(CourseEnrollment.student_id)
        .join(CourseOffering)
        .where(CourseOffering.teacher_id == teacher_id)
        .distinct()
    )
    return set(result.scalars().all())


async def teacher_can_access_student(db: AsyncSession, teacher_id: int, student_id: int) -> bool:
    created = await db.scalar(
        select(User.id).where(
            User.id == student_id,
            User.role == UserRole.STUDENT,
            User.created_by_id == teacher_id,
        )
    )
    if created is not None:
        return True
    enrolled = await db.scalar(
        select(CourseEnrollment.id)
        .join(CourseOffering)
        .where(
            CourseEnrollment.student_id == student_id,
            CourseOffering.teacher_id == teacher_id,
        )
        .limit(1)
    )
    return enrolled is not None


async def student_has_other_teacher_enrollments(
    db: AsyncSession, student_id: int, teacher_id: int
) -> bool:
    other = await db.scalar(
        select(CourseEnrollment.id)
        .join(CourseOffering)
        .where(
            CourseEnrollment.student_id == student_id,
            CourseOffering.teacher_id != teacher_id,
        )
        .limit(1)
    )
    return other is not None


async def list_students_visible_to(db: AsyncSession, actor: User) -> list[User]:
    if actor.role == UserRole.ADMIN:
        result = await db.execute(
            select(User).where(User.role == UserRole.STUDENT).order_by(User.full_name)
        )
        return list(result.scalars().all())

    enrolled_ids = await enrolled_student_ids_for_teacher(db, actor.id)
    scope = [User.created_by_id == actor.id]
    if enrolled_ids:
        scope.append(User.id.in_(enrolled_ids))
    result = await db.execute(
        select(User)
        .where(User.role == UserRole.STUDENT, or_(*scope))
        .order_by(User.full_name)
    )
    return list(result.scalars().all())


async def assert_teacher_can_access_student(
    db: AsyncSession, actor: User, student_id: int
) -> User:
    student = await db.get(User, student_id)
    if not student or student.role != UserRole.STUDENT:
        raise HTTPException(status_code=404, detail="תלמיד לא נמצא")
    if actor.role == UserRole.ADMIN:
        return student
    if actor.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="אין הרשאה")
    if not await teacher_can_access_student(db, actor.id, student_id):
        raise HTTPException(status_code=403, detail="התלמיד לא משויך אליך")
    return student


async def assert_teacher_can_delete_student(
    db: AsyncSession, actor: User, student_id: int
) -> User:
    student = await assert_teacher_can_access_student(db, actor, student_id)
    if actor.role == UserRole.ADMIN:
        return student
    if await student_has_other_teacher_enrollments(db, student_id, actor.id):
        raise HTTPException(
            status_code=403,
            detail="לא ניתן למחוק תלמיד הרשום גם אצל מורה אחר",
        )
    return student
