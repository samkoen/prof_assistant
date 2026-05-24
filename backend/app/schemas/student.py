from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import EnrollmentStatus
from app.schemas.types import AppEmail


class StudentCreate(BaseModel):
    email: AppEmail
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)
    phone: str | None = None
    student_id: str | None = None


class StudentResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str | None
    student_id: str | None
    email_verified: bool

    model_config = {"from_attributes": True}


class AddStudentToCourseRequest(BaseModel):
    student_id: int


class CourseEnrollmentDetail(BaseModel):
    id: int
    offering_id: int
    student_id: int
    student_name: str
    student_email: str
    status: EnrollmentStatus
    created_at: datetime

    model_config = {"from_attributes": True}
