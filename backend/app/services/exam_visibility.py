"""Visibilité d'une מטלה pour un élève (privée, ou masquée par l'enseignant)."""

from fastapi import HTTPException
from sqlalchemy import or_, select

from app.models.exam import Exam

_HIDDEN = "מטלה לא נמצאה"


def student_can_see_exam(exam: Exam, student_id: int) -> bool:
    if getattr(exam, "hidden_from_students", False):
        return False
    return getattr(exam, "private_student_id", None) in (None, student_id)


def visible_exam_ids_for_student(student_id: int):
    return select(Exam.id).where(
        Exam.hidden_from_students.is_(False),
        or_(Exam.private_student_id.is_(None), Exam.private_student_id == student_id),
    )


def ensure_student_can_see_exam(exam: Exam, student_id: int) -> None:
    if not student_can_see_exam(exam, student_id):
        raise HTTPException(status_code=404, detail=_HIDDEN)
