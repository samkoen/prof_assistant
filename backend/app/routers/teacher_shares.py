from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import TeacherShareStatus, UserRole
from app.models.teacher_share import TeacherContentShare
from app.models.user import User
from app.schemas.teacher_share import TeacherShareAccept, TeacherShareCreate, TeacherShareResponse
from app.services.teacher_share_service import (
    accept_teacher_share,
    create_teacher_share,
    decline_teacher_share,
    share_to_response,
)

router = APIRouter(prefix="/teacher-shares", tags=["teacher-shares"])


@router.post("", response_model=TeacherShareResponse)
async def send_share(
    body: TeacherShareCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    share = await create_teacher_share(body, user, db)
    await db.commit()
    await db.refresh(share)
    return await share_to_response(share, db, user.id)


@router.get("/incoming", response_model=list[TeacherShareResponse])
async def list_incoming(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    result = await db.execute(
        select(TeacherContentShare)
        .where(TeacherContentShare.recipient_id == user.id)
        .order_by(TeacherContentShare.created_at.desc())
    )
    shares = result.scalars().all()
    return [await share_to_response(s, db, user.id) for s in shares]


@router.get("/sent", response_model=list[TeacherShareResponse])
async def list_sent(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    result = await db.execute(
        select(TeacherContentShare)
        .where(TeacherContentShare.sender_id == user.id)
        .order_by(TeacherContentShare.created_at.desc())
    )
    shares = result.scalars().all()
    return [await share_to_response(s, db, user.id) for s in shares]


@router.post("/{share_id}/accept", response_model=TeacherShareResponse)
async def accept_share(
    share_id: int,
    body: TeacherShareAccept,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    share = await accept_teacher_share(share_id, body, user, db)
    await db.commit()
    await db.refresh(share)
    return await share_to_response(share, db, user.id)


@router.post("/{share_id}/decline", response_model=TeacherShareResponse)
async def decline_share(
    share_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER)),
):
    share = await decline_teacher_share(share_id, user, db)
    await db.commit()
    await db.refresh(share)
    return await share_to_response(share, db, user.id)
