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
    auto_approve_enrollment: bool = False


class CourseOfferingEnrollmentSettingsUpdate(BaseModel):
    is_open_enrollment: bool | None = None
    auto_approve_enrollment: bool | None = None
    join_link_valid_days: int | None = Field(default=None, ge=1, le=365)


class JoinLinkRenewRequest(BaseModel):
    valid_days: int = Field(default=30, ge=1, le=365)


class CourseOfferingResponse(BaseModel):
    id: int
    catalog_course_id: int
    catalog_name: str
    group_name: str
    academic_year: int
    semester: int
    description: str | None
    is_open_enrollment: bool
    auto_approve_enrollment: bool
    teacher_name: str
    created_at: datetime
    enrollment_status: EnrollmentStatus | None = None
    join_token: str | None = None
    join_token_expires_at: datetime | None = None

    model_config = {"from_attributes": True}


class JoinPreviewResponse(BaseModel):
    offering_id: int
    catalog_name: str
    group_name: str
    academic_year: int
    semester: int
    teacher_name: str
    description: str | None
    is_open_enrollment: bool
    auto_approve_enrollment: bool
    already_enrolled: bool = False
    enrollment_status: EnrollmentStatus | None = None
    join_link_expired: bool = False
    join_token_expires_at: datetime | None = None


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
    catalog_name: str | None = None
    group_name: str | None = None
    academic_year: int | None = None
    semester: int | None = None

    model_config = {"from_attributes": True}


class EnrollmentReview(BaseModel):
    status: EnrollmentStatus


class TeacherOpenOfferingsResponse(BaseModel):
    teacher_id: int
    teacher_name: str
    teacher_email: str
    offerings: list[CourseOfferingResponse]
