from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.offering_teacher import (
    OfferingTeacherInviteCreate,
    OfferingTeacherInviteResponse,
    OfferingTeachersResponse,
)
from app.services.offering_teacher_service import (
    accept_offering_teacher_invite,
    cancel_offering_teacher_invite,
    create_offering_teacher_invite,
    decline_offering_teacher_invite,
    invite_to_response,
    leave_offering,
    list_incoming_invites,
    list_offering_teachers_payload,
    list_sent_invites,
    load_invite,
    remove_offering_co_teacher,
)

router = APIRouter(tags=["offering-teachers"])


@router.post("/courses/{offering_id}/teacher-invites", response_model=OfferingTeacherInviteResponse)
async def invite_offering_teacher(
    offering_id: int,
    body: OfferingTeacherInviteCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    invite = await create_offering_teacher_invite(offering_id, body, user, db)
    await db.commit()
    return invite_to_response(await load_invite(db, invite.id))


@router.get("/courses/{offering_id}/teachers", response_model=OfferingTeachersResponse)
async def get_offering_teachers(
    offering_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    return await list_offering_teachers_payload(offering_id, user, db)


@router.delete("/courses/{offering_id}/teachers/{teacher_id}")
async def delete_offering_co_teacher(
    offering_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    await remove_offering_co_teacher(offering_id, teacher_id, user, db)
    await db.commit()
    return {"ok": True}


@router.post("/courses/{offering_id}/teachers/me/leave")
async def leave_offering_as_teacher(
    offering_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    await leave_offering(offering_id, user, db)
    await db.commit()
    return {"ok": True}


@router.get("/offering-teacher-invites/incoming", response_model=list[OfferingTeacherInviteResponse])
async def incoming_offering_invites(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    return [invite_to_response(i) for i in await list_incoming_invites(db, user.id)]


@router.get("/offering-teacher-invites/sent", response_model=list[OfferingTeacherInviteResponse])
async def sent_offering_invites(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    return [invite_to_response(i) for i in await list_sent_invites(db, user.id)]


@router.post(
    "/offering-teacher-invites/{invite_id}/accept",
    response_model=OfferingTeacherInviteResponse,
)
async def accept_invite(
    invite_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    invite = await accept_offering_teacher_invite(invite_id, user, db)
    await db.commit()
    return invite_to_response(await load_invite(db, invite.id))


@router.post(
    "/offering-teacher-invites/{invite_id}/decline",
    response_model=OfferingTeacherInviteResponse,
)
async def decline_invite(
    invite_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    invite = await decline_offering_teacher_invite(invite_id, user, db)
    await db.commit()
    return invite_to_response(await load_invite(db, invite.id))


@router.delete(
    "/offering-teacher-invites/{invite_id}",
    response_model=OfferingTeacherInviteResponse,
)
async def cancel_invite(
    invite_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    invite = await cancel_offering_teacher_invite(invite_id, user, db)
    await db.commit()
    return invite_to_response(await load_invite(db, invite.id))
