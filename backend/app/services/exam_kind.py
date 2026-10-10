from app.models.exam import Exam, ExamSession, StudentExamAttempt


def is_tirgoul(exam: Exam | None) -> bool:
    return bool(exam and exam.is_tirgoul)


def should_shuffle_questions(exam: Exam | None) -> bool:
    """L'ordre des questions d'un תרגול reste celui du professeur."""
    return not is_tirgoul(exam)


def should_shuffle_options(exam: Exam | None) -> bool:
    """Options toujours mélangées par tentative (examen comme תרגול), pour éviter les positions fixes."""
    return True


def apply_exam_kind(exam: Exam, tirgoul: bool) -> None:
    exam.is_tirgoul = tirgoul
    exam.shuffle_questions = not tirgoul
    exam.shuffle_options = True
    if tirgoul:
        exam.auto_submit_on_timeout = False


def integrity_on_activate(exam: Exam) -> bool:
    return not is_tirgoul(exam)


def student_sees_official_results(exam: Exam, session: ExamSession) -> bool:
    if is_tirgoul(exam):
        return True
    return bool(session.results_published)


def hide_attempt_score(exam: Exam, session: ExamSession, attempt: StudentExamAttempt) -> bool:
    if not attempt.submitted_at:
        return False
    return not student_sees_official_results(exam, session)
