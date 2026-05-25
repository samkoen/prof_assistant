from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.security import COOKIE_NAME, create_access_token, hash_password, verify_password
from app.services.email import send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookie(response: Response, token: str, role: UserRole | str) -> None:
    from app.security import _as_role

    role_enum = _as_role(role)
    days = (
        settings.access_token_expire_days_student
        if role_enum == UserRole.STUDENT
        else settings.access_token_expire_days_staff
    )
    max_age = days * 24 * 60 * 60
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=max_age,
        domain=settings.cookie_domain,
        path="/",
    )


@router.post("/register", response_model=UserResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if body.role != UserRole.STUDENT:
        raise HTTPException(status_code=400, detail="רק תלמידים יכולים להירשם בעצמם")
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="האימייל כבר קיים")
    user = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        role=UserRole.STUDENT,
        phone=body.phone,
        student_id=body.student_id,
        email_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    await send_verification_email(user.email, f"verify-{user.id}")
    return user


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="אימייל או סיסמה שגויים")
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="המשתמש חסום")
    if not user.email_verified and not user.email_verified_by_teacher:
        raise HTTPException(status_code=403, detail="יש לאמת את האימייל")
    token = create_access_token(user.id, user.role)
    _set_auth_cookie(response, token, user.role)
    return TokenResponse(user=UserResponse.model_validate(user))


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/", domain=settings.cookie_domain)
    return {"ok": True}


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return user
