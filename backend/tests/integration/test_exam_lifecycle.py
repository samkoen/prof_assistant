import pytest

from tests.integration.conftest import ItEnv
from tests.integration.exam_flow import (
    add_open_question,
    add_single_question,
    create_draft_exam,
    prepared_qcm_session,
    student_review,
    student_start_exam,
    student_submit_qcm,
    teacher_catalog_and_offering,
)
from tests.integration.http_helpers import json_ok, login, logout
from tests.integration.seed import STUDENT_EMAIL, TEACHER_EMAIL


@pytest.mark.integration
async def test_teacher_adds_qcm_and_open_questions(it_env: ItEnv):
    await login(it_env.client, TEACHER_EMAIL)
    catalog_id, offering_id = await teacher_catalog_and_offering(it_env.client)
    exam = await create_draft_exam(it_env.client, catalog_id, offering_id)
    qcm = await add_single_question(it_env.client, exam["id"])
    open_id = await add_open_question(it_env.client, exam["id"])
    detail = await json_ok(await it_env.client.get(f"/api/exams/{exam['id']}"))
    types = {row["id"]: row["question_type"] for row in detail["questions"]}
    assert detail["is_editable"] is True
    assert len(detail["questions"]) == 2
    assert types[qcm["question_id"]] == "single"
    assert types[open_id] == "open"


@pytest.mark.integration
async def test_cannot_add_question_after_exam_started(it_env: ItEnv):
    ctx = await prepared_qcm_session(
        it_env.client, it_env.users.student_id, it_env.users.classmate_id
    )
    await login(it_env.client, TEACHER_EMAIL)
    response = await it_env.client.post(
        f"/api/exams/{ctx['exam_id']}/questions",
        json={"text": "שאלה מאוחרת", "question_type": "open", "points": 1, "options": []},
    )
    assert response.status_code == 400


@pytest.mark.integration
async def test_student_starts_exam(it_env: ItEnv):
    ctx = await prepared_qcm_session(
        it_env.client, it_env.users.student_id, it_env.users.classmate_id
    )
    await login(it_env.client, STUDENT_EMAIL)
    take = await student_start_exam(it_env.client, ctx["session_id"])
    assert take["attempt"]["started_at"]
    assert take["attempt"]["submitted_at"] is None
    assert len(take["questions"]) == 1
    assert "is_correct" not in take["questions"][0]["options"][0]


@pytest.mark.integration
async def test_teacher_closes_exam_and_student_sees_results(it_env: ItEnv):
    ctx = await prepared_qcm_session(
        it_env.client, it_env.users.student_id, it_env.users.classmate_id
    )
    await login(it_env.client, STUDENT_EMAIL)
    await student_start_exam(it_env.client, ctx["session_id"])
    submitted = await student_submit_qcm(
        it_env.client, ctx["session_id"], ctx["question_id"], ctx["correct_option_id"]
    )
    assert submitted["submitted_at"]
    hidden = await student_review(it_env.client, ctx["session_id"])
    assert hidden["show_correction"] is False
    assert hidden["results_published"] is False
    await logout(it_env.client)
    await _teacher_publishes(it_env, ctx["session_id"], it_env.users.student_id)
    await _student_sees_score(it_env, ctx["session_id"])


async def _teacher_publishes(it_env: ItEnv, session_id: int, student_id: int) -> None:
    await login(it_env.client, TEACHER_EMAIL)
    closed = await json_ok(await it_env.client.post(f"/api/exams/sessions/{session_id}/close"))
    assert closed["status"] == "closed"
    assert closed["results_published"] is True
    results = await json_ok(await it_env.client.get(f"/api/exams/sessions/{session_id}/results"))
    by_id = {row["student_id"]: row for row in results["results"]}
    assert by_id[student_id]["status"] == "submitted"
    assert by_id[student_id]["score"] == 1
    assert by_id[it_env.users.classmate_id]["status"] == "not_started"
    await logout(it_env.client)


async def _student_sees_score(it_env: ItEnv, session_id: int) -> None:
    await login(it_env.client, STUDENT_EMAIL)
    review = await student_review(it_env.client, session_id)
    assert review["show_correction"] is True
    assert review["results_published"] is True
    assert review["attempt"]["score"] == 1
    assert review["questions"][0]["is_correct"] is True
    assert review["questions"][0]["earned_points"] == 1
