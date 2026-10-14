import pytest

from tests.integration.conftest import ItEnv
from tests.integration.exam_flow import (
    add_single_question,
    create_draft_exam,
    enroll_student,
    student_start_exam,
    student_submit_qcm,
    teacher_catalog_and_offering,
)
from tests.integration.http_helpers import json_ok, login, logout
from tests.integration.seed import CLASSMATE_EMAIL, STUDENT_EMAIL, TEACHER_EMAIL

_SECRET = "מטלה סודית"


async def _class_course(client, student_id: int, classmate_id: int) -> tuple[int, int]:
    await login(client, TEACHER_EMAIL)
    catalog_id, offering_id = await teacher_catalog_and_offering(client)
    await enroll_student(client, offering_id, student_id)
    await enroll_student(client, offering_id, classmate_id)
    await logout(client)
    return catalog_id, offering_id


def _titles(rows: list[dict], key: str) -> list[str]:
    return [row[key] for row in rows]


@pytest.mark.integration
async def test_private_class_matala_is_hidden_from_teacher_and_classmates(it_env: ItEnv):
    client = it_env.client
    catalog_id, offering_id = await _class_course(client, it_env.users.student_id, it_env.users.classmate_id)

    await login(client, STUDENT_EMAIL)
    official = await client.post(
        "/api/exams",
        json={
            "catalog_course_id": catalog_id,
            "offering_id": offering_id,
            "title": "מבחן",
            "shuffle_questions": True,
            "shuffle_options": True,
            "is_tirgoul": False,
        },
    )
    assert official.status_code == 403
    exam = await create_draft_exam(client, catalog_id, offering_id, title=_SECRET, is_tirgoul=True)
    question = await add_single_question(client, exam["id"])
    board = await json_ok(await client.get(f"/api/exams/sessions/offering/{offering_id}/student-board"))
    mine = [row for row in board["sessions"] if row["exam_title"] == _SECRET]
    assert len(mine) == 1 and mine[0]["owned_by_me"] is True
    session_id = mine[0]["id"]
    await student_start_exam(client, session_id)
    await student_submit_qcm(client, session_id, question["question_id"], question["correct_option_id"])
    await logout(client)

    await login(client, CLASSMATE_EMAIL)
    classmate = await json_ok(await client.get(f"/api/exams/sessions/offering/{offering_id}/student-board"))
    assert _SECRET not in _titles(classmate["sessions"], "exam_title")
    hidden = await client.get(f"/api/exams/sessions/{session_id}/take")
    assert hidden.status_code == 404
    await logout(client)

    await login(client, TEACHER_EMAIL)
    teacher = await json_ok(await client.get(f"/api/exams/sessions/offering/{offering_id}/teacher-board"))
    assert _SECRET not in _titles(teacher["sessions"], "exam_title")
    assert _SECRET not in _titles(teacher["exams"], "title")
    assert (await client.get(f"/api/exams/sessions/{session_id}/results")).status_code == 404
    grades = await json_ok(
        await client.get(f"/api/courses/{offering_id}/students/{it_env.users.student_id}/exam-results")
    )
    assert _SECRET not in _titles(grades["results"], "exam_title")
    await logout(client)
