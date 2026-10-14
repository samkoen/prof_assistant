from pydantic import BaseModel, Field

from app.schemas.auth import UserResponse
from app.services.billing.admin_credits import MAX_ADMIN_CREDITS


class AdminUserCredits(BaseModel):
    credits: int | None = None
    unlimited: bool = False
    product: str | None = None


class AdminUserResponse(UserResponse):
    ai_credits: AdminUserCredits


class AdminSetCreditsBody(BaseModel):
    credits: int = Field(ge=0, le=MAX_ADMIN_CREDITS)


class AdminSetCreditsResponse(BaseModel):
    user_id: int
    credits: int
    product: str
