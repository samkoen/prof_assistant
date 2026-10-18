from app.models.enums import ExamKind
from app.models.exam import Exam, ExamSession, StudentExamAttempt


def exam_kind_value(exam: Exam | None) -> ExamKind:
    """Kind explicite, sinon le booléen historique is_tirgoul."""
    if exam is None:
        return ExamKind.OFFICIAL
    raw = getattr(exam, "kind", None)
    if raw in (ExamKind.TASK, ExamKind.TIRGOUL, ExamKind.OFFICIAL, "task", "tirgoul", "official"):
        return ExamKind(raw)
    if getattr(exam, "is_tirgoul", False):
        return ExamKind.TIRGOUL
    return ExamKind.OFFICIAL


def is_tirgoul(exam: Exam | None) -> bool:
    return exam_kind_value(exam) == ExamKind.TIRGOUL


def is_task(exam: Exam | None) -> bool:
    return exam_kind_value(exam) == ExamKind.TASK


def should_shuffle_questions(exam: Exam | None) -> bool:
    """L'ordre des questions d'un תרגול reste celui du professeur."""
    return not is_tirgoul(exam)


def should_shuffle_options(exam: Exam | None) -> bool:
    """Options toujours mélangées par tentative (examen comme תרגול), pour éviter les positions fixes."""
    return True


def apply_task_kind(exam: Exam) -> None:
    exam.kind = ExamKind.TASK
    exam.is_tirgoul = False
    exam.shuffle_questions = False
    exam.shuffle_options = False
    exam.auto_submit_on_timeout = False


def apply_exam_kind(exam: Exam, tirgoul: bool) -> None:
    if is_task(exam):
        apply_task_kind(exam)
        return
    exam.kind = ExamKind.TIRGOUL if tirgoul else ExamKind.OFFICIAL
    exam.is_tirgoul = tirgoul
    exam.shuffle_questions = not tirgoul
    exam.shuffle_options = True
    if tirgoul:
        exam.auto_submit_on_timeout = False


def integrity_on_activate(exam: Exam) -> bool:
    return exam_kind_value(exam) == ExamKind.OFFICIAL


def student_sees_official_results(exam: Exam, session: ExamSession) -> bool:
    if is_tirgoul(exam):
        return True
    return bool(session.results_published)


def hide_attempt_score(exam: Exam, session: ExamSession, attempt: StudentExamAttempt) -> bool:
    if not attempt.submitted_at:
        return False
    return not student_sees_official_results(exam, session)
