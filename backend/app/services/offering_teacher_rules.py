from fastapi import HTTPException

from app.models.enums import OfferingTeacherRole, UserRole


def ensure_inviter_owns_offering(offering, inviter_id: int) -> None:
    if offering.teacher_id != inviter_id:
        raise HTTPException(status_code=403, detail="אין הרשאה")


def ensure_recipient_is_invitable(recipient, inviter_id: int) -> None:
    if not recipient or recipient.role != UserRole.TEACHER or recipient.is_blocked:
        raise HTTPException(status_code=404, detail="מורה לא נמצא — בדקו את האימייל")
    if recipient.id == inviter_id:
        raise HTTPException(status_code=400, detail="לא ניתן להזמין את עצמך")


def ensure_not_already_member(is_member: bool) -> None:
    if is_member:
        raise HTTPException(status_code=400, detail="המורה כבר משויך להרצה")


def ensure_no_pending_invite(has_pending: bool) -> None:
    if has_pending:
        raise HTTPException(status_code=400, detail="הזמנה ממתינה כבר נשלחה למורה זה")


def ensure_can_remove_member(target_role: str) -> None:
    if target_role == OfferingTeacherRole.OWNER.value:
        raise HTTPException(status_code=403, detail="לא ניתן להסיר את בעל ההרצה")


def ensure_can_leave(member_role: str) -> None:
    if member_role == OfferingTeacherRole.OWNER.value:
        raise HTTPException(status_code=400, detail="בעל ההרצה אינו יכול לעזוב")
