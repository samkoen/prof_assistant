from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import CourseEnrollment
from app.models.exam import StudentExamAttempt
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
