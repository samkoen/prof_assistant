import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"


class EnrollmentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ExamStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"


class ExamKind(str, enum.Enum):
    OFFICIAL = "official"
    TIRGOUL = "tirgoul"
    TASK = "task"


class TaskVerdict(str, enum.Enum):
    DONE = "done"
    PARTIAL = "partial"
    NOT_DONE = "not_done"


class TaskReviewSource(str, enum.Enum):
    AUTO = "auto"
    AI = "ai"
    TEACHER = "teacher"


class ExamQuestionsLanguage(str, enum.Enum):
    HE = "he"
    FR = "fr"
    EN = "en"
    RU = "ru"


class QuestionType(str, enum.Enum):
    SINGLE = "single"
    MULTIPLE = "multiple"
    TRUE_FALSE = "true_false"
    OPEN = "open"


class ModelAnswerSource(str, enum.Enum):
    TEACHER = "teacher"
    AI = "ai"


class MultipleScoringMode(str, enum.Enum):
    ALL_OR_NOTHING = "all_or_nothing"
    PROPORTIONAL = "proportional"


class NotificationType(str, enum.Enum):
    ENROLLMENT_APPROVED = "enrollment_approved"
    ENROLLMENT_REJECTED = "enrollment_rejected"
    ENROLLMENT_REQUESTED = "enrollment_requested"
    EXAM_AVAILABLE = "exam_available"
    EXAM_RESULTS = "exam_results"
    TIME_WARNING = "time_warning"
    TIME_EXPIRED = "time_expired"
    TEACHER_SHARE_RECEIVED = "teacher_share_received"
    OFFERING_TEACHER_INVITE = "offering_teacher_invite"


class TeacherShareType(str, enum.Enum):
    EXAM = "exam"
    CATALOG = "catalog"


class TeacherShareStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class OfferingTeacherRole(str, enum.Enum):
    OWNER = "owner"
    CO_TEACHER = "co_teacher"


class OfferingTeacherInviteStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
