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
    EXAM_AVAILABLE = "exam_available"
    EXAM_RESULTS = "exam_results"
    TIME_WARNING = "time_warning"
    TIME_EXPIRED = "time_expired"
