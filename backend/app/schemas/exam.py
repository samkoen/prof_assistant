from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.course import CourseOfferingResponse

from app.models.enums import ExamStatus, MultipleScoringMode, QuestionType
from app.schemas.catalog_scope import CatalogItemScopeFields, CatalogItemScopeResponse


class QuestionOptionCreate(BaseModel):
    text: str = ""
    is_correct: bool = False
    order_index: int = 0
    image_url: str | None = None


class QuestionOptionResponse(BaseModel):
    id: int
    text: str
    is_correct: bool | None = None
    order_index: int
    image_url: str | None = None

    model_config = {"from_attributes": True}


class QuestionCreate(BaseModel):
    text: str = ""
    image_url: str | None = None
    question_type: QuestionType
    order_index: int = 0
    points: float = 1.0
    multiple_scoring_mode: MultipleScoringMode | None = None
    options: list[QuestionOptionCreate]


class QuestionUpdate(BaseModel):
    text: str = ""
    image_url: str | None = None
    question_type: QuestionType
    points: float = 1.0
    multiple_scoring_mode: MultipleScoringMode | None = None
    options: list[QuestionOptionCreate]


class QuestionResponse(BaseModel):
    id: int
    text: str
    image_url: str | None = None
    question_type: QuestionType
    order_index: int
    points: float
    multiple_scoring_mode: MultipleScoringMode | None
    options: list[QuestionOptionResponse]

    model_config = {"from_attributes": True}


class ExamCreate(CatalogItemScopeFields):
    catalog_course_id: int
    offering_id: int | None = None
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
    questions_language: Literal["he", "fr", "en", "ru"] = "he"
    question_count: int = 0
    can_delete: bool = True

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
    integrity_mode_enabled: bool = False
    question_count: int = 0

    model_config = {"from_attributes": True}


class ExamSessionActivate(BaseModel):
    offering_id: int
    integrity_mode_enabled: bool = False
    duration_minutes: int | None = Field(default=None, ge=1, le=300)
    warning_minutes: int | None = Field(default=None, ge=1, le=60)
    auto_submit_on_timeout: bool | None = None


class IntegrityEventItem(BaseModel):
    event_type: str = Field(pattern="^(tab_hidden|tab_visible)$")
    occurred_at: datetime | None = None
    duration_seconds: int | None = Field(default=None, ge=0, le=86400)


class IntegrityEventsRequest(BaseModel):
    events: list[IntegrityEventItem] = Field(min_length=1, max_length=50)


class SubmitAnswerItem(BaseModel):
    question_id: int
    selected_option_ids: list[int]


class SubmitExamRequest(BaseModel):
    answers: list[SubmitAnswerItem]


class SavedAnswerDraft(BaseModel):
    question_id: int
    selected_option_ids: list[int]


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
    practice_active: bool = False
    practice_score: float | None = None
    practice_max_score: float | None = None
    practice_submitted_at: datetime | None = None
    rules_accepted_at: datetime | None = None
    focus_loss_count: int = 0
    total_hidden_seconds: int = 0

    model_config = {"from_attributes": True}


class StudentExamSessionRow(ExamSessionResponse):
    attempt: AttemptResponse | None = None


class StudentOfferingExamsBoard(BaseModel):
    offering: CourseOfferingResponse
    sessions: list[StudentExamSessionRow]


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
    focus_loss_count: int | None = None
    total_hidden_seconds: int | None = None


class ExamSessionResultsResponse(BaseModel):
    session_id: int
    exam_id: int
    exam_title: str
    offering_label: str
    integrity_mode_enabled: bool = False
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
    questions_language: Literal["he", "fr", "en", "ru"] | None = None


class QuestionsImportResponse(BaseModel):
    imported_count: int
    questions: list[QuestionResponse]


class QuestionsReorderRequest(BaseModel):
    question_ids: list[int] = Field(min_length=1)


class ExamDetailResponse(ExamResponse):
    catalog_course_name: str = ""
    questions: list[QuestionResponse] = []
    is_editable: bool = True


class StudentQuestionOptionResponse(BaseModel):
    id: int
    text: str
    image_url: str | None = None
    order_index: int

    model_config = {"from_attributes": True}


class StudentQuestionResponse(BaseModel):
    id: int
    text: str
    image_url: str | None = None
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
    auto_submit_on_timeout: bool = True
    integrity_mode_enabled: bool = False
    questions_language: Literal["he", "fr", "en", "ru"] = "he"
    attempt: AttemptResponse
    questions: list[StudentQuestionResponse]
    saved_answers: list[SavedAnswerDraft] = []


class ExamReviewCorrectOption(BaseModel):
    text: str
    image_url: str | None = None


class ExamReviewQuestion(BaseModel):
    id: int
    text: str
    image_url: str | None = None
    question_type: QuestionType
    order_index: int
    points: float
    is_correct: bool
    correct_options: list[ExamReviewCorrectOption]
    student_options: list[ExamReviewCorrectOption] = []


class ExamReviewResponse(BaseModel):
    session_id: int
    exam_title: str
    show_correction: bool
    questions_language: Literal["he", "fr", "en", "ru"] = "he"
    attempt: AttemptResponse
    questions: list[ExamReviewQuestion]
    for_practice: bool = False


class PracticeResultResponse(BaseModel):
    id: int
    score: float
    max_score: float
    submitted_at: datetime

    model_config = {"from_attributes": True}
