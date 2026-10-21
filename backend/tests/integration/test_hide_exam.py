import pytest

from tests.integration.conftest import ItEnv
from tests.integration.exam_flow import (
    activate_exam,
    add_single_question,
    create_draft_exam,
    enroll_student,
    teacher_catalog_and_offering,
)
from tests.integration.http_helpers import json_ok, login, logout
from tests.integration.seed import STUDENT_EMAIL, TEACHER_EMAIL

_TITLE = "מטלה נסתרת"


def _titles(rows: list[dict]) -> list[str]:
    return [row["exam_title"] for row in rows]


async def _set_hidden(client, exam_id: int, hidden: bool) -> dict:
    response = await client.patch(
        f"/api/exams/{exam_id}/student-visibility",
        json={"hidden_from_students": hidden},
    )
    return await json_ok(response)


@pytest.mark.integration
async def test_hidden_exam_disappears_for_students_only(it_env: ItEnv):
    client = it_env.client
    await login(client, TEACHER_EMAIL)
    catalog_id, offering_id = await teacher_catalog_and_offering(client)
    exam = await create_draft_exam(client, catalog_id, offering_id, title=_TITLE)
    await add_single_question(client, exam["id"])
    await enroll_student(client, offering_id, it_env.users.student_id)
    session = await activate_exam(client, exam["id"], offering_id)

    hidden = await _set_hidden(client, exam["id"], True)
    assert hidden["hidden_from_students"] is True
    teacher = await json_ok(
        await client.get(f"/api/exams/sessions/offering/{offering_id}/teacher-board")
    )
    assert _TITLE in _titles(teacher["sessions"])
    await logout(client)

    await login(client, STUDENT_EMAIL)
    board = await json_ok(
        await client.get(f"/api/exams/sessions/offering/{offering_id}/student-board")
    )
    assert _TITLE not in _titles(board["sessions"])
    take = await client.get(f"/api/exams/sessions/{session['id']}/take")
    assert take.status_code == 404
    await logout(client)

    await login(client, TEACHER_EMAIL)
    shown = await _set_hidden(client, exam["id"], False)
    assert shown["hidden_from_students"] is False
    await logout(client)

    await login(client, STUDENT_EMAIL)
    again = await json_ok(
        await client.get(f"/api/exams/sessions/offering/{offering_id}/student-board")
    )
    assert _TITLE in _titles(again["sessions"])
