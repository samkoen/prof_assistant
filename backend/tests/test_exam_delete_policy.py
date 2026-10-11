from app.services.exam_lifecycle import can_delete_exam


def test_tirgoul_stays_deletable_after_auto_activation():
    assert can_delete_exam(is_tirgoul_exam=True, activated=True) is True


def test_official_exam_blocks_delete_once_activated():
    assert can_delete_exam(is_tirgoul_exam=False, activated=True) is False


def test_draft_exam_can_be_deleted():
    assert can_delete_exam(is_tirgoul_exam=False, activated=False) is True
    assert can_delete_exam(is_tirgoul_exam=True, activated=False) is True
