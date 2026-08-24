from app.models.enums import QuestionType
from app.models.exam import OpenAnswerEvaluation, Question
from app.schemas.exam import ExamReviewCorrectOption, ExamReviewQuestion
from app.services.scoring import score_question


def _is_full_score(earned: float, max_pts: float) -> bool:
    return earned >= max_pts - 1e-9


def _qcm_review_row(
    question: Question, order_index: int, selected_ids: list[int]
) -> ExamReviewQuestion:
    earned, max_pts = score_question(question, selected_ids)
    is_fully_correct = _is_full_score(earned, max_pts)
    correct_opts = sorted([o for o in question.options if o.is_correct], key=lambda o: o.order_index)
    student_opts = sorted(
        [o for o in question.options if o.id in selected_ids],
        key=lambda o: o.order_index,
    )
    return ExamReviewQuestion(
        id=question.id,
        text=question.text,
        image_url=question.image_url,
        question_type=question.question_type,
        order_index=order_index,
        points=question.points,
        is_correct=is_fully_correct,
        earned_points=earned,
        evaluation_pending=False,
        correct_options=[
            ExamReviewCorrectOption(text=o.text, image_url=o.image_url) for o in correct_opts
        ],
        student_options=(
            [ExamReviewCorrectOption(text=o.text, image_url=o.image_url) for o in student_opts]
            if not is_fully_correct
            else []
        ),
    )


def _open_review_row(
    question: Question,
    order_index: int,
    text_answer: str | None,
    evaluation: OpenAnswerEvaluation | None,
) -> ExamReviewQuestion:
    pending = evaluation is None
    earned = None if pending else evaluation.suggested_score
    is_correct = (not pending) and _is_full_score(earned or 0.0, question.points)
    return ExamReviewQuestion(
        id=question.id,
        text=question.text,
        image_url=question.image_url,
        question_type=question.question_type,
        order_index=order_index,
        points=question.points,
        is_correct=is_correct,
        earned_points=earned,
        evaluation_pending=pending,
        student_text_answer=text_answer or None,
        model_answer=question.model_answer,
        appreciation=evaluation.appreciation if evaluation else None,
        correct_options=[],
        student_options=[],
    )


def review_question_row(
    question: Question,
    order_index: int,
    selected_ids: list[int],
    text_answer: str | None,
    evaluation: OpenAnswerEvaluation | None,
) -> ExamReviewQuestion:
    if question.question_type == QuestionType.OPEN:
        return _open_review_row(question, order_index, text_answer, evaluation)
    return _qcm_review_row(question, order_index, selected_ids)
