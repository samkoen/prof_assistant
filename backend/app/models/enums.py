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


class ExamQuestionsLanguage(str, enum.Enum):
    HE = "he"
    FR = "fr"
    EN = "en"
    RU = "ru"


class QuestionType(str, enum.Enum):
    SINGLE = "single"
    MULTIPLE = "multiple"
    TRUE_FALSE = "true_false"


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


class TeacherShareType(str, enum.Enum):
    EXAM = "exam"
    CATALOG = "catalog"


class TeacherShareStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
