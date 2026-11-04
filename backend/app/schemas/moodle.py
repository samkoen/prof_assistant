from pydantic import BaseModel, Field


class MoodleConnectionStatus(BaseModel):
    connected: bool
    base_url: str | None = None
    moodle_user_id: int | None = None


class MoodleConnectionSave(BaseModel):
    base_url: str = Field(min_length=8, max_length=512)
    token: str = Field(min_length=1, max_length=256)


class MoodleCourseItem(BaseModel):
    id: int
    shortname: str
    fullname: str
    offering_id: int | None = None


class MoodleCourseImport(BaseModel):
    moodle_course_id: int
    offering_id: int | None = None


class MoodleImportCourseResult(BaseModel):
    offering_id: int
    moodle_course_id: int
    created: bool


class MoodleUnknownStudent(BaseModel):
    email: str
    fullname: str


class MoodleSkippedStudent(BaseModel):
    email: str
    fullname: str
    reason: str


class MoodleStudentImportResult(BaseModel):
    enrolled: int
    already: int
    unknown: list[MoodleUnknownStudent]
    skipped: list[MoodleSkippedStudent]


class MoodleAssignmentItem(BaseModel):
    id: int
    name: str
    grade_max: float


class MoodleAssignmentsView(BaseModel):
    linked: bool
    moodle_course_id: int | None = None
    assignments: list[MoodleAssignmentItem] = []
    selected_assign_id: int | None = None


class MoodleAssignmentSelect(BaseModel):
    moodle_assign_id: int


class MoodleGradeSkip(BaseModel):
    student_name: str
    reason: str


class MoodleGradePushResult(BaseModel):
    sent: int
    skipped: list[MoodleGradeSkip]
