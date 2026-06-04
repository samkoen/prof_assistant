"""Recherche des cours ouverts d'un professeur par e-mail (flux élève)."""

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import CourseOffering
from app.models.enums import UserRole
from app.models.user import User
from app.services.course_helpers import offering_to_response
from app.services.enrollment_service import load_student_enrolled_session_keys


async def find_teacher_by_email(db: AsyncSession, email: str) -> User:
    normalized = email.strip().lower()
    result = await db.execute(
        select(User).where(User.email == normalized, User.role == UserRole.TEACHER)
    )
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="מורה לא נמצא — בדקו את כתובת האימייל")
    if teacher.is_blocked:
        raise HTTPException(status_code=404, detail="מורה לא נמצא — בדקו את כתובת האימייל")
    return teacher


def filter_offerings_for_student(
    offerings: list[CourseOffering],
    enrolled_keys: set[tuple[int, int, int]],
) -> list[CourseOffering]:
    return [
        o
        for o in offerings
        if (o.catalog_course_id, o.academic_year, o.semester) not in enrolled_keys
    ]


async def load_teacher_open_offerings(
    db: AsyncSession,
    teacher_id: int,
    student_id: int,
    offering_query,
) -> list[CourseOffering]:
    result = await db.execute(
        offering_query.where(
            CourseOffering.teacher_id == teacher_id,
            CourseOffering.is_open_enrollment.is_(True),
        ).order_by(CourseOffering.academic_year.desc(), CourseOffering.semester, CourseOffering.group_name)
    )
    offerings = list(result.scalars().all())
    enrolled_keys = await load_student_enrolled_session_keys(db, student_id)
    return filter_offerings_for_student(offerings, enrolled_keys)


def offerings_to_responses(offerings: list[CourseOffering]):
    return [offering_to_response(o) for o in offerings]
