from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course import CourseOffering
from app.models.enums import (
    NotificationType,
    OfferingTeacherInviteStatus,
    OfferingTeacherRole,
    UserRole,
)
from app.models.notification import Notification
from app.models.offering_teacher import OfferingTeacher, OfferingTeacherInvite
from app.models.user import User
from app.schemas.offering_teacher import (
    OfferingTeacherInviteCreate,
    OfferingTeacherInviteResponse,
    OfferingTeacherRef,
    OfferingTeachersResponse,
)
from app.services.offering_access import (
    is_offering_member,
    require_teacher_manages_offering,
    require_teacher_owns_offering,
)
from app.services.offering_teacher_rules import (
    ensure_can_leave,
    ensure_can_remove_member,
    ensure_inviter_owns_offering,
    ensure_no_pending_invite,
    ensure_not_already_member,
    ensure_recipient_is_invitable,
)


def _invite_query():
    return select(OfferingTeacherInvite).options(
        selectinload(OfferingTeacherInvite.offering).selectinload(CourseOffering.catalog_course),
        selectinload(OfferingTeacherInvite.inviter),
        selectinload(OfferingTeacherInvite.recipient),
    )


def invite_to_response(invite: OfferingTeacherInvite) -> OfferingTeacherInviteResponse:
    offering = invite.offering
    catalog_name = offering.catalog_course.name if offering and offering.catalog_course else ""
    return OfferingTeacherInviteResponse(
        id=invite.id,
        offering_id=invite.offering_id,
        catalog_name=catalog_name,
        group_name=offering.group_name if offering else "",
        academic_year=offering.academic_year if offering else 0,
        semester=offering.semester if offering else 0,
        inviter_id=invite.inviter_id,
        inviter_name=invite.inviter.full_name if invite.inviter else "",
        recipient_id=invite.recipient_id,
        recipient_name=invite.recipient.full_name if invite.recipient else "",
        status=OfferingTeacherInviteStatus(invite.status),
        message=invite.message,
        created_at=invite.created_at,
        resolved_at=invite.resolved_at,
    )


async def _find_teacher_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(
        select(User).where(User.email == email.strip().lower(), User.role == UserRole.TEACHER)
    )
    return result.scalar_one_or_none()


async def _find_pair_invite(
    db: AsyncSession, offering_id: int, recipient_id: int
) -> OfferingTeacherInvite | None:
    result = await db.execute(
        select(OfferingTeacherInvite).where(
            OfferingTeacherInvite.offering_id == offering_id,
            OfferingTeacherInvite.recipient_id == recipient_id,
        )
    )
    return result.scalar_one_or_none()


def _reset_invite_pending(invite: OfferingTeacherInvite, inviter_id: int, message: str | None) -> None:
    invite.inviter_id = inviter_id
    invite.message = message
    invite.status = OfferingTeacherInviteStatus.PENDING.value
    invite.resolved_at = None


async def _notify_invite(db: AsyncSession, recipient_id: int, offering: CourseOffering, inviter: User) -> None:
    catalog = offering.catalog_course.name if offering.catalog_course else ""
    db.add(
        Notification(
            user_id=recipient_id,
            type=NotificationType.OFFERING_TEACHER_INVITE,
            title="הזמנה להוראה משותפת",
            body=f"{inviter.full_name} הזמין/ה אותך ל-{catalog} — {offering.group_name}",
            related_offering_id=offering.id,
        )
    )


async def create_offering_teacher_invite(
    offering_id: int, body: OfferingTeacherInviteCreate, inviter: User, db: AsyncSession
) -> OfferingTeacherInvite:
    offering = await require_teacher_owns_offering(db, offering_id, inviter.id)
    ensure_inviter_owns_offering(offering, inviter.id)
    recipient = await _find_teacher_by_email(db, body.recipient_email)
    ensure_recipient_is_invitable(recipient, inviter.id)
    assert recipient is not None
    await _assert_can_create_invite(db, offering_id, recipient.id)
    invite = await _upsert_pending_invite(db, offering, inviter, recipient, body.message)
    offering = await _offering_with_catalog(db, offering.id)
    await _notify_invite(db, recipient.id, offering, inviter)
    return invite


async def _offering_with_catalog(db: AsyncSession, offering_id: int) -> CourseOffering:
    result = await db.execute(
        select(CourseOffering)
        .options(selectinload(CourseOffering.catalog_course))
        .where(CourseOffering.id == offering_id)
    )
    return result.scalar_one()


async def _assert_can_create_invite(db: AsyncSession, offering_id: int, recipient_id: int) -> None:
    ensure_not_already_member(await is_offering_member(db, offering_id, recipient_id))
    existing = await _find_pair_invite(db, offering_id, recipient_id)
    ensure_no_pending_invite(bool(existing and existing.status == OfferingTeacherInviteStatus.PENDING.value))


async def _upsert_pending_invite(
    db: AsyncSession,
    offering: CourseOffering,
    inviter: User,
    recipient: User,
    message: str | None,
) -> OfferingTeacherInvite:
    existing = await _find_pair_invite(db, offering.id, recipient.id)
    if existing:
        _reset_invite_pending(existing, inviter.id, message)
        return existing
    invite = OfferingTeacherInvite(
        offering_id=offering.id,
        inviter_id=inviter.id,
        recipient_id=recipient.id,
        status=OfferingTeacherInviteStatus.PENDING.value,
        message=message,
    )
    db.add(invite)
    await db.flush()
    return invite


async def _load_pending_invite_for_recipient(
    invite_id: int, recipient: User, db: AsyncSession
) -> OfferingTeacherInvite:
    result = await db.execute(_invite_query().where(OfferingTeacherInvite.id == invite_id))
    invite = result.scalar_one_or_none()
    if not invite or invite.recipient_id != recipient.id:
        raise HTTPException(status_code=404, detail="הזמנה לא נמצאה")
    if invite.status != OfferingTeacherInviteStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="ההזמנה כבר טופלה")
    return invite


async def accept_offering_teacher_invite(
    invite_id: int, recipient: User, db: AsyncSession
) -> OfferingTeacherInvite:
    invite = await _load_pending_invite_for_recipient(invite_id, recipient, db)
    if not await is_offering_member(db, invite.offering_id, recipient.id):
        db.add(
            OfferingTeacher(
                offering_id=invite.offering_id,
                teacher_id=recipient.id,
                role=OfferingTeacherRole.CO_TEACHER.value,
            )
        )
    invite.status = OfferingTeacherInviteStatus.ACCEPTED.value
    invite.resolved_at = datetime.now(timezone.utc)
    return invite


async def decline_offering_teacher_invite(
    invite_id: int, recipient: User, db: AsyncSession
) -> OfferingTeacherInvite:
    invite = await _load_pending_invite_for_recipient(invite_id, recipient, db)
    invite.status = OfferingTeacherInviteStatus.DECLINED.value
    invite.resolved_at = datetime.now(timezone.utc)
    return invite


async def cancel_offering_teacher_invite(
    invite_id: int, owner: User, db: AsyncSession
) -> OfferingTeacherInvite:
    result = await db.execute(_invite_query().where(OfferingTeacherInvite.id == invite_id))
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="הזמנה לא נמצאה")
    await require_teacher_owns_offering(db, invite.offering_id, owner.id)
    if invite.status != OfferingTeacherInviteStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="ההזמנה כבר טופלה")
    invite.status = OfferingTeacherInviteStatus.DECLINED.value
    invite.resolved_at = datetime.now(timezone.utc)
    return invite


async def remove_offering_co_teacher(
    offering_id: int, teacher_id: int, owner: User, db: AsyncSession
) -> None:
    await require_teacher_owns_offering(db, offering_id, owner.id)
    member = await _load_membership(db, offering_id, teacher_id)
    ensure_can_remove_member(member.role)
    await db.delete(member)


async def leave_offering(offering_id: int, teacher: User, db: AsyncSession) -> None:
    member = await _load_membership(db, offering_id, teacher.id)
    ensure_can_leave(member.role)
    await db.delete(member)


async def _load_membership(db: AsyncSession, offering_id: int, teacher_id: int) -> OfferingTeacher:
    result = await db.execute(
        select(OfferingTeacher).where(
            OfferingTeacher.offering_id == offering_id,
            OfferingTeacher.teacher_id == teacher_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="המורה לא משויך להרצה")
    return member


async def list_incoming_invites(db: AsyncSession, user_id: int) -> list[OfferingTeacherInvite]:
    result = await db.execute(
        _invite_query()
        .where(OfferingTeacherInvite.recipient_id == user_id)
        .order_by(OfferingTeacherInvite.created_at.desc())
    )
    return list(result.scalars().all())


async def list_sent_invites(db: AsyncSession, user_id: int) -> list[OfferingTeacherInvite]:
    result = await db.execute(
        _invite_query()
        .where(OfferingTeacherInvite.inviter_id == user_id)
        .order_by(OfferingTeacherInvite.created_at.desc())
    )
    return list(result.scalars().all())


def teacher_refs_from_members(members: list[OfferingTeacher], offering: CourseOffering) -> list[OfferingTeacherRef]:
    refs = [
        OfferingTeacherRef(
            id=m.teacher_id,
            name=m.teacher.full_name if m.teacher else "",
            role=OfferingTeacherRole(m.role),
        )
        for m in members
    ]
    refs.sort(key=lambda r: (0 if r.role == OfferingTeacherRole.OWNER else 1, r.name))
    if refs:
        return refs
    name = offering.teacher.full_name if offering.teacher else ""
    return [OfferingTeacherRef(id=offering.teacher_id, name=name, role=OfferingTeacherRole.OWNER)]


async def load_invite(db: AsyncSession, invite_id: int) -> OfferingTeacherInvite:
    result = await db.execute(_invite_query().where(OfferingTeacherInvite.id == invite_id))
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="הזמנה לא נמצאה")
    return invite


async def list_offering_teachers_payload(
    offering_id: int, user: User, db: AsyncSession
) -> OfferingTeachersResponse:
    if user.role == UserRole.ADMIN:
        offering = await db.get(CourseOffering, offering_id)
        if not offering:
            raise HTTPException(status_code=404, detail="קורס לא נמצא")
    else:
        offering = await require_teacher_manages_offering(db, offering_id, user.id)
    members = await _load_members_with_users(db, offering_id)
    pending = await _pending_invites_for_offering(db, offering_id)
    return OfferingTeachersResponse(
        teachers=teacher_refs_from_members(members, offering),
        pending_invites=[invite_to_response(i) for i in pending],
    )


async def _load_members_with_users(db: AsyncSession, offering_id: int) -> list[OfferingTeacher]:
    result = await db.execute(
        select(OfferingTeacher)
        .options(selectinload(OfferingTeacher.teacher))
        .where(OfferingTeacher.offering_id == offering_id)
    )
    return list(result.scalars().all())


async def _pending_invites_for_offering(db: AsyncSession, offering_id: int) -> list[OfferingTeacherInvite]:
    result = await db.execute(
        _invite_query().where(
            OfferingTeacherInvite.offering_id == offering_id,
            OfferingTeacherInvite.status == OfferingTeacherInviteStatus.PENDING.value,
        )
    )
    return list(result.scalars().all())
