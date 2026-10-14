from types import SimpleNamespace

from app.services.exam_group_removal import keeps_catalog_exam, without_excluded


def test_shared_exam_stays_when_removed_from_one_group():
    assert keeps_catalog_exam(1) is True
    assert keeps_catalog_exam(0) is False


def test_excluded_exam_disappears_from_that_group_only():
    exams = [SimpleNamespace(id=7), SimpleNamespace(id=8)]
    visible = without_excluded(exams, {7})
    assert [exam.id for exam in visible] == [8]
