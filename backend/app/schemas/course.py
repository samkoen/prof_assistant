from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import EnrollmentStatus


class CourseOfferingCreate(BaseModel):
    catalog_course_id: int
    group_name: str = Field(min_length=1, max_length=255)
    academic_year: int = Field(ge=2000, le=2100)
    semester: int = Field(ge=1, le=3)
    description: str | None = None
    is_open_enrollment: bool = True


class CourseOfferingResponse(BaseModel):
    id: int
    catalog_course_id: int
    catalog_name: str
    group_name: str
    academic_year: int
    semester: int
    description: str | None
    is_open_enrollment: bool
    teacher_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class EnrollmentRequest(BaseModel):
    offering_id: int


class EnrollmentResponse(BaseModel):
    id: int
    offering_id: int
    student_id: int
    student_name: str
    student_email: str
    status: EnrollmentStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class EnrollmentReview(BaseModel):
    status: EnrollmentStatus
