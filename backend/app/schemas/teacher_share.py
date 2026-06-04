from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import TeacherShareStatus, TeacherShareType


class TeacherShareCreate(BaseModel):
    recipient_email: str = Field(min_length=3, max_length=255)
    share_type: TeacherShareType
    exam_id: int | None = None
    catalog_id: int | None = None
    message: str | None = Field(default=None, max_length=500)


class TeacherShareAccept(BaseModel):
    target_catalog_id: int | None = None
    new_catalog_name: str | None = Field(default=None, min_length=1, max_length=255)
    new_catalog_description: str | None = None


class TeacherShareResponse(BaseModel):
    id: int
    share_type: TeacherShareType
    status: TeacherShareStatus
    sender_id: int
    sender_name: str
    recipient_id: int
    recipient_name: str
    source_exam_id: int | None
    source_exam_title: str | None
    source_catalog_id: int | None
    source_catalog_name: str | None
    source_exam_count: int | None = None
    target_catalog_id: int | None
    target_catalog_name: str | None
    message: str | None
    created_at: datetime
    resolved_at: datetime | None
    suggested_catalog_id: int | None = None

    model_config = {"from_attributes": True}
