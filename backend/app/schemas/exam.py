from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ExamStatus, MultipleScoringMode, QuestionType
from app.schemas.catalog_scope import CatalogItemScopeFields, CatalogItemScopeResponse


class QuestionOptionCreate(BaseModel):
    text: str
    is_correct: bool = False
    order_index: int = 0


class QuestionOptionResponse(BaseModel):
    id: int
    text: str
    is_correct: bool | None = None
    order_index: int

    model_config = {"from_attributes": True}


class QuestionCreate(BaseModel):
    text: str
    question_type: QuestionType
    order_index: int = 0
    points: float = 1.0
    multiple_scoring_mode: MultipleScoringMode | None = None
    options: list[QuestionOptionCreate]


class QuestionUpdate(BaseModel):
    text: str
    question_type: QuestionType
    points: float = 1.0
    multiple_scoring_mode: MultipleScoringMode | None = None
    options: list[QuestionOptionCreate]


class QuestionResponse(BaseModel):
    id: int
    text: str
    question_type: QuestionType
    order_index: int
    points: float
    multiple_scoring_mode: MultipleScoringMode | None
    options: list[QuestionOptionResponse]

    model_config = {"from_attributes": True}


class ExamCreate(CatalogItemScopeFields):
    catalog_course_id: int
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    duration_minutes: int = Field(default=45, ge=1, le=300)
    shuffle_questions: bool
    shuffle_options: bool
    show_detailed_correction: bool = True
    warning_minutes: int = Field(default=10, ge=1, le=60)
    auto_submit_on_timeout: bool = True
    default_multiple_scoring: MultipleScoringMode = MultipleScoringMode.PROPORTIONAL


class ExamUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    duration_minutes: int | None = None
    shuffle_questions: bool | None = None
    shuffle_options: bool | None = None
    show_detailed_correction: bool | None = None
    warning_minutes: int | None = None
    auto_submit_on_timeout: bool | None = None
    default_multiple_scoring: MultipleScoringMode | None = None
    scope_teacher_id: int | None = None
    scope_academic_year: int | None = Field(default=None, ge=2000, le=2100)
    scope_semester: int | None = Field(default=None, ge=1, le=3)
    scope_group_name: str | None = Field(default=None, max_length=255)


class ExamDuplicateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)


class ExamResponse(CatalogItemScopeResponse):
    id: int
    catalog_course_id: int
    title: str
    description: str | None
    duration_minutes: int
    shuffle_questions: bool
    shuffle_options: bool
    show_detailed_correction: bool
    warning_minutes: int
    auto_submit_on_timeout: bool
    default_multiple_scoring: MultipleScoringMode
    question_count: int = 0

    model_config = {"from_attributes": True}


class ExamSessionResponse(BaseModel):
    id: int
    exam_id: int
    offering_id: int
    exam_title: str
    catalog_name: str
    group_name: str
    academic_year: int
    semester: int
    status: ExamStatus
    activated_at: datetime | None
    closed_at: datetime | None
    results_published: bool
    question_count: int = 0

    model_config = {"from_attributes": True}


class ExamSessionActivate(BaseModel):
    offering_id: int


class SubmitAnswerItem(BaseModel):
    question_id: int
    selected_option_ids: list[int]


class SubmitExamRequest(BaseModel):
    answers: list[SubmitAnswerItem]


class AttemptResponse(BaseModel):
    id: int
    exam_session_id: int
    exam_id: int
    started_at: datetime | None
    expires_at: datetime | None
    submitted_at: datetime | None
    score: float | None
    max_score: float | None
    progress_index: int
    can_resubmit: bool

    model_config = {"from_attributes": True}


class StudentExamResultRow(BaseModel):
    student_id: int
    student_name: str
    student_number: str | None
    attempt_id: int | None
    started_at: datetime | None
    submitted_at: datetime | None
    score: float | None
    max_score: float | None
    status: str


class ExamSessionResultsResponse(BaseModel):
    session_id: int
    exam_id: int
    exam_title: str
    offering_label: str
    results: list[StudentExamResultRow]


class StudentOfferingExamResultRow(BaseModel):
    session_id: int
    exam_id: int
    exam_title: str
    session_status: ExamStatus
    attempt_id: int | None
    started_at: datetime | None
    submitted_at: datetime | None
    score: float | None
    max_score: float | None
    status: str


class StudentOfferingExamResultsResponse(BaseModel):
    student_id: int
    student_name: str
    student_number: str | None
    offering_id: int
    offering_label: str
    results: list[StudentOfferingExamResultRow]


class QuestionsImportRequest(BaseModel):
    questions: list[QuestionCreate] = Field(min_length=1)


class QuestionsImportResponse(BaseModel):
    imported_count: int
    questions: list[QuestionResponse]


class QuestionsReorderRequest(BaseModel):
    question_ids: list[int] = Field(min_length=1)


class ExamDetailResponse(ExamResponse):
    questions: list[QuestionResponse] = []
    is_editable: bool = True


class StudentQuestionOptionResponse(BaseModel):
    id: int
    text: str
    order_index: int

    model_config = {"from_attributes": True}


class StudentQuestionResponse(BaseModel):
    id: int
    text: str
    question_type: QuestionType
    order_index: int
    points: float
    options: list[StudentQuestionOptionResponse]


class ExamTakeResponse(BaseModel):
    session_id: int
    offering_id: int
    exam_title: str
    description: str | None
    duration_minutes: int
    warning_minutes: int
    attempt: AttemptResponse
    questions: list[StudentQuestionResponse]
