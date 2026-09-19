from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import OfferingTeacherInviteStatus, OfferingTeacherRole
from app.schemas.types import AppEmail


class OfferingTeacherRef(BaseModel):
    id: int
    name: str
    role: OfferingTeacherRole


class OfferingTeacherInviteCreate(BaseModel):
    recipient_email: AppEmail
    message: str | None = Field(default=None, max_length=500)


class OfferingTeacherInviteResponse(BaseModel):
    id: int
    offering_id: int
    catalog_name: str
    group_name: str
    academic_year: int
    semester: int
    inviter_id: int
    inviter_name: str
    recipient_id: int
    recipient_name: str
    status: OfferingTeacherInviteStatus
    message: str | None
    created_at: datetime
    resolved_at: datetime | None

    model_config = {"from_attributes": True}


class OfferingTeachersResponse(BaseModel):
    teachers: list[OfferingTeacherRef]
    pending_invites: list[OfferingTeacherInviteResponse]
