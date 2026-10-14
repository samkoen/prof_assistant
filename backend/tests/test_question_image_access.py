from types import SimpleNamespace

from app.models.enums import UserRole
from app.services.question_media import viewer_may_edit_images


def _user(role: UserRole, user_id: int):
    return SimpleNamespace(role=role, id=user_id)


def _tirgoul(*, owner: int | None = None):
    return SimpleNamespace(is_tirgoul=True, private_student_id=owner, created_by_id=owner or 1)


def test_student_owner_previews_images_before_any_attempt():
    exam = _tirgoul(owner=7)
    catalog = SimpleNamespace(owner_student_id=None, teacher_id=1)
    assert viewer_may_edit_images(_user(UserRole.STUDENT, 7), exam, catalog)


def test_personal_subject_owner_previews_images():
    exam = _tirgoul()
    catalog = SimpleNamespace(owner_student_id=7, teacher_id=None)
    assert viewer_may_edit_images(_user(UserRole.STUDENT, 7), exam, catalog)


def test_classmate_cannot_preview_private_images():
    exam = _tirgoul(owner=7)
    catalog = SimpleNamespace(owner_student_id=None, teacher_id=1)
    assert not viewer_may_edit_images(_user(UserRole.STUDENT, 8), exam, catalog)
