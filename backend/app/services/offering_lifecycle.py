"""Modification et suppression d'une הרצה (propriétaire)."""

from fastapi import HTTPException
from sqlalchemy import delete, func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import CourseCatalog, CourseEnrollment, CourseOffering
from app.models.exam import ExamSession
from app.models.notification import Notification
from app.models.offering_teacher import OfferingTeacher, OfferingTeacherInvite
from app.schemas.course import CourseOfferingUpdate

_DUPLICATE = "הרצה או שם קורס כבר קיימים"
_HAS_EXAMS = "לא ניתן למחוק קורס שמשויכים אליו מבחנים"


def normalized_offering_fields(body: CourseOfferingUpdate) -> dict:
    """Champs nettoyés. Un nom vide après trim est refusé."""
    catalog_name = body.catalog_name.strip()
    group_name = body.group_name.strip()
    if not catalog_name or not group_name:
        raise HTTPException(status_code=400, detail="יש למלא שם קורס וקבוצה")
    description = (body.description or "").strip()
    return {
        "catalog_name": catalog_name,
        "group_name": group_name,
        "academic_year": body.academic_year,
        "semester": body.semester,
        "description": description or None,
    }


def apply_offering_fields(offering: CourseOffering, catalog: CourseCatalog, fields: dict) -> None:
    catalog.name = fields["catalog_name"]
    offering.group_name = fields["group_name"]
    offering.academic_year = fields["academic_year"]
    offering.semester = fields["semester"]
    offering.description = fields["description"]


def refuse_if_offering_has_exams(session_count: int) -> None:
    if session_count:
        raise HTTPException(status_code=400, detail=_HAS_EXAMS)


async def commit_offering_change(db: AsyncSession) -> None:
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail=_DUPLICATE) from None


async def offering_exam_session_count(db: AsyncSession, offering_id: int) -> int:
    count = await db.scalar(
        select(func.count()).select_from(ExamSession).where(ExamSession.offering_id == offering_id)
    )
    return int(count or 0)


async def delete_offering_dependents(db: AsyncSession, offering_id: int) -> None:
    """Inscriptions, invitations et lien des notifications. Les מבחנים bloquent avant."""
    await db.execute(delete(CourseEnrollment).where(CourseEnrollment.offering_id == offering_id))
    await db.execute(delete(OfferingTeacherInvite).where(OfferingTeacherInvite.offering_id == offering_id))
    await db.execute(delete(OfferingTeacher).where(OfferingTeacher.offering_id == offering_id))
    await db.execute(
        update(Notification)
        .where(Notification.related_offering_id == offering_id)
        .values(related_offering_id=None)
    )
