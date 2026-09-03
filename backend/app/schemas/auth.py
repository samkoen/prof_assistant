from pydantic import BaseModel, Field

from app.models.enums import UserRole
from app.schemas.gemini_questions import GeminiSeriesLanguage
from app.schemas.types import AppEmail


class RegisterRequest(BaseModel):
    email: AppEmail
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)
    role: UserRole = UserRole.STUDENT
    phone: str | None = None
    student_id: str | None = None


class LoginRequest(BaseModel):
    email: AppEmail
    password: str


class ResendVerificationRequest(BaseModel):
    email: AppEmail


class ResendVerificationResponse(BaseModel):
    ok: bool = True


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    phone: str | None
    student_id: str | None
    avatar_url: str | None
    email_verified: bool
    is_blocked: bool = False
    ai_explanation_language: GeminiSeriesLanguage = "he"

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    user: UserResponse


class UserAiExplanationLanguageUpdateRequest(BaseModel):
    language: GeminiSeriesLanguage


class UserProfileUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2)
    email: AppEmail | None = None
    phone: str | None = None
    student_id: str | None = None
    current_password: str | None = None
    new_password: str | None = Field(default=None, min_length=6)


class UserProfileUpdateResponse(BaseModel):
    user: UserResponse
    email_verification_sent: bool = False
