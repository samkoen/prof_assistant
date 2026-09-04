from app.models.enums import QuestionType


def validate_question_key(
    question_type: QuestionType,
    option_ids: set[int],
    correct_ids: set[int],
) -> str | None:
    if question_type == QuestionType.OPEN:
        return "לא ניתן לעדכן מפתח לשאלה פתוחה"
    if not correct_ids:
        return "יש לבחור תשובה נכונה"
    if not correct_ids <= option_ids:
        return "אפשרות לא שייכת לשאלה"
    if question_type in (QuestionType.SINGLE, QuestionType.TRUE_FALSE) and len(correct_ids) != 1:
        return "נדרשת תשובה נכונה אחת"
    return None


def apply_option_correct_flags(options, correct_ids: set[int]) -> bool:
    changed = False
    for opt in options:
        wanted = opt.id in correct_ids
        if opt.is_correct != wanted:
            opt.is_correct = wanted
            changed = True
    return changed
