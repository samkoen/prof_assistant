from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import CourseOffering
from app.models.enums import OfferingTeacherRole
from app.models.offering_teacher import OfferingTeacher


def teacher_owns_offering(offering: CourseOffering, teacher_id: int) -> bool:
    return offering.teacher_id == teacher_id


def offering_managed_by_clause(teacher_id: int):
    member_ids = select(OfferingTeacher.offering_id).where(OfferingTeacher.teacher_id == teacher_id)
    return or_(CourseOffering.teacher_id == teacher_id, CourseOffering.id.in_(member_ids))


async def is_offering_member(db: AsyncSession, offering_id: int, teacher_id: int) -> bool:
    row = await db.scalar(
        select(OfferingTeacher.id).where(
            OfferingTeacher.offering_id == offering_id,
            OfferingTeacher.teacher_id == teacher_id,
        )
    )
    if row is not None:
        return True
    offering = await db.get(CourseOffering, offering_id)
    return offering is not None and offering.teacher_id == teacher_id


async def list_offering_member_ids(db: AsyncSession, offering_id: int) -> list[int]:
    rows = await db.execute(
        select(OfferingTeacher.teacher_id).where(OfferingTeacher.offering_id == offering_id)
    )
    ids = list(rows.scalars().all())
    if ids:
        return ids
    offering = await db.get(CourseOffering, offering_id)
    return [offering.teacher_id] if offering else []


async def require_teacher_manages_offering(
    db: AsyncSession,
    offering_id: int,
    teacher_id: int,
    *,
    status_code: int = 404,
    detail: str = "קורס לא נמצא",
) -> CourseOffering:
    offering = await db.get(CourseOffering, offering_id)
    if not offering or not await is_offering_member(db, offering_id, teacher_id):
        raise HTTPException(status_code=status_code, detail=detail)
    return offering


async def require_teacher_owns_offering(
    db: AsyncSession, offering_id: int, teacher_id: int
) -> CourseOffering:
    offering = await db.get(CourseOffering, offering_id)
    if not offering:
        raise HTTPException(status_code=404, detail="קורס לא נמצא")
    if not teacher_owns_offering(offering, teacher_id):
        raise HTTPException(status_code=403, detail="אין הרשאה")
    return offering


async def ensure_owner_membership(db: AsyncSession, offering: CourseOffering) -> None:
    existing = await db.scalar(
        select(OfferingTeacher.id).where(
            OfferingTeacher.offering_id == offering.id,
            OfferingTeacher.teacher_id == offering.teacher_id,
        )
    )
    if existing is not None:
        return
    db.add(
        OfferingTeacher(
            offering_id=offering.id,
            teacher_id=offering.teacher_id,
            role=OfferingTeacherRole.OWNER.value,
        )
    )
