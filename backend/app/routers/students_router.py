"""Routes élèves : création et liste (scopées par prof)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.student import StudentCreate, StudentResponse
from app.security import hash_password
from app.services.student_service import (
    assert_teacher_can_access_student,
    assert_teacher_can_delete_student,
    delete_student_account,
    list_students_visible_to,
)

router = APIRouter(prefix="/students", tags=["students"])


@router.get("", response_model=list[StudentResponse])
async def list_students(
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_roles(UserRole.ADMIN, UserRole.TEACHER)),
):
    return await list_students_visible_to(db, current)


@router.post("", response_model=StudentResponse)
async def create_student(
    body: StudentCreate,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_roles(UserRole.ADMIN, UserRole.TEACHER)),
):
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="האימייל כבר קיים")

    student = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        role=UserRole.STUDENT,
        phone=body.phone,
        student_id=body.student_id,
        email_verified=True,
        email_verified_by_teacher=current.role == UserRole.TEACHER,
        created_by_id=current.id if current.role == UserRole.TEACHER else None,
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student


@router.post("/{student_id}/verify-email-bypass")
async def verify_without_email(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_roles(UserRole.ADMIN, UserRole.TEACHER)),
):
    """מורה או מנהל מאשרים תלמיד ללא אימות אימייל — רק בתחום שלהם."""
    student = await assert_teacher_can_access_student(db, current, student_id)
    if student.email_verified:
        return {"ok": True}
    student.email_verified_by_teacher = True
    student.email_verified = True
    await db.commit()
    return {"ok": True}


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current: User = Depends(require_roles(UserRole.ADMIN, UserRole.TEACHER)),
):
    student = await assert_teacher_can_delete_student(db, current, student_id)
    await delete_student_account(db, student)
    await db.commit()
