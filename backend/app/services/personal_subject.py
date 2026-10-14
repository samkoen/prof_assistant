"""Matière personnelle : catalogue sans professeur, instance privée, élève inscrit."""

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import CourseCatalog, CourseEnrollment, CourseOffering
from app.models.enums import EnrollmentStatus, UserRole
from app.models.exam import Exam
from app.models.user import User
from app.services.course_helpers import offering_eager_options
from app.services.join_token_service import assign_join_token, expires_at_from_valid_days

PERSONAL_GROUP = "אישי"


def personal_period() -> tuple[int, int]:
    return datetime.now(timezone.utc).year, 1


def _clear_scope(body) -> None:
    body.scope_teacher_id = None
    body.scope_academic_year = None
    body.scope_semester = None
    body.scope_group_name = None


def _bind_group_scope(body, offering: CourseOffering) -> None:
    body.scope_academic_year = offering.academic_year
    body.scope_semester = offering.semester
    body.scope_group_name = offering.group_name


async def _enrolled_offering(db: AsyncSession, offering_id: int | None, catalog_id: int, student_id: int) -> CourseOffering:
    offering = await db.get(CourseOffering, offering_id) if offering_id else None
    if not offering or offering.catalog_course_id != catalog_id:
        raise HTTPException(status_code=403, detail="אין הרשאה")
    enrolled = await db.scalar(
        select(CourseEnrollment.id).where(
            CourseEnrollment.offering_id == offering.id,
            CourseEnrollment.student_id == student_id,
            CourseEnrollment.status == EnrollmentStatus.APPROVED,
        )
    )
    if not enrolled:
        raise HTTPException(status_code=403, detail="אין הרשאה")
    return offering


async def prepare_student_create(body, catalog: CourseCatalog, user: User, db: AsyncSession) -> int | None:
    """Tirgoul perso, ou tirgoul privé sur un cours de classe. Retourne l'élève propriétaire."""
    if user.role != UserRole.STUDENT:
        return None
    if not body.is_tirgoul:
        raise HTTPException(status_code=403, detail="אין הרשאה")
    _clear_scope(body)
    if catalog.owner_student_id == user.id:
        return None
    if catalog.teacher_id is None or catalog.owner_student_id is not None:
        raise HTTPException(status_code=403, detail="אין הרשאה")
    offering = await _enrolled_offering(db, body.offering_id, catalog.id, user.id)
    _bind_group_scope(body, offering)
    return user.id


def student_may_edit_exam(exam: Exam, catalog: CourseCatalog, user: User) -> bool:
    if user.role != UserRole.STUDENT or not exam.is_tirgoul:
        return False
    if exam.private_student_id == user.id:
        return True
    return catalog.owner_student_id == user.id


def _new_catalog(student_id: int, name: str, description: str | None) -> CourseCatalog:
    return CourseCatalog(
        name=name.strip(),
        description=description,
        teacher_id=None,
        owner_student_id=student_id,
    )


def _new_offering(catalog_id: int, year: int, semester: int) -> CourseOffering:
    offering = CourseOffering(
        catalog_course_id=catalog_id,
        teacher_id=None,
        group_name=PERSONAL_GROUP,
        academic_year=year,
        semester=semester,
        is_open_enrollment=False,
        auto_approve_enrollment=False,
        join_token="pending",
        join_token_expires_at=expires_at_from_valid_days(1),
    )
    assign_join_token(offering)
    return offering


def _approved(offering_id: int, student_id: int) -> CourseEnrollment:
    return CourseEnrollment(
        offering_id=offering_id,
        student_id=student_id,
        status=EnrollmentStatus.APPROVED,
        reviewed_at=datetime.now(timezone.utc),
    )


async def _flush_catalog(db: AsyncSession, catalog: CourseCatalog) -> None:
    db.add(catalog)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="מקצוע בשם זה כבר קיים")


async def create_personal_subject(
    db: AsyncSession, student: User, name: str, description: str | None
) -> CourseOffering:
    year, semester = personal_period()
    catalog = _new_catalog(student.id, name, description)
    await _flush_catalog(db, catalog)
    offering = _new_offering(catalog.id, year, semester)
    db.add(offering)
    await db.flush()
    db.add(_approved(offering.id, student.id))
    await db.flush()
    return offering


async def load_offering(db: AsyncSession, offering_id: int) -> CourseOffering:
    result = await db.execute(
        select(CourseOffering)
        .options(*offering_eager_options())
        .where(CourseOffering.id == offering_id)
    )
    return result.scalar_one()
