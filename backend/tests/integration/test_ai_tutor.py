import pytest

from tests.integration.ai_mocks import EXPLANATION_TEXT
from tests.integration.conftest import ItEnv
from tests.integration.exam_flow import (
    activate_exam,
    add_single_question,
    create_draft_exam,
    enroll_student,
    prepared_qcm_session,
    student_review,
    student_start_exam,
    student_submit_qcm,
    teacher_catalog_and_offering,
)
from tests.integration.http_helpers import json_ok, login, logout
from tests.integration.seed import STUDENT_EMAIL, TEACHER_EMAIL


def _tutor(session_id: int, question_id: int) -> str:
    return f"/api/exams/sessions/{session_id}/questions/{question_id}/tutor"


async def _published_qcm(it_env: ItEnv) -> dict:
    client = it_env.client
    await login(client, TEACHER_EMAIL)
    catalog_id, offering_id = await teacher_catalog_and_offering(client)
    exam = await create_draft_exam(client, catalog_id, offering_id, title="מבחן עוזר")
    qcm = await add_single_question(client, exam["id"])
    await enroll_student(client, offering_id, it_env.users.student_id)
    session = await activate_exam(client, exam["id"], offering_id)
    await logout(client)
    await login(client, STUDENT_EMAIL)
    await student_start_exam(client, session["id"])
    wrong = qcm["correct_option_id"] - 1
    await student_submit_qcm(client, session["id"], qcm["question_id"], wrong)
    return {"exam_id": exam["id"], "session_id": session["id"], **qcm}


@pytest.mark.integration
async def test_tutor_conversation_after_results(it_env: ItEnv):
    data = await _published_qcm(it_env)
    review = await student_review(it_env.client, data["session_id"])
    assert review["ai_tutor_enabled"] is True
    path = _tutor(data["session_id"], data["question_id"])
    empty = await json_ok(await it_env.client.get(path))
    assert empty["messages"] == [] and empty["remaining_messages"] == 10
    body = await json_ok(
        await it_env.client.post(f"{path}/messages", json={"text": "למה טעיתי?", "action": "why_wrong"})
    )
    assert [m["role"] for m in body["messages"]] == ["user", "model"]
    assert body["messages"][1]["content"] == EXPLANATION_TEXT
    assert body["remaining_messages"] == 9 and body["charged"] is True
    again = await json_ok(await it_env.client.get(path))
    assert len(again["messages"]) == 2


@pytest.mark.integration
async def test_tutor_disabled_by_teacher(it_env: ItEnv):
    data = await _published_qcm(it_env)
    await logout(it_env.client)
    await login(it_env.client, TEACHER_EMAIL)
    patched = await json_ok(
        await it_env.client.patch(f"/api/exams/{data['exam_id']}", json={"ai_tutor_enabled": False})
    )
    assert patched["ai_tutor_enabled"] is False
    await logout(it_env.client)
    await login(it_env.client, STUDENT_EMAIL)
    res = await it_env.client.get(_tutor(data["session_id"], data["question_id"]))
    assert res.status_code == 403


@pytest.mark.integration
async def test_tutor_refused_before_publication(it_env: ItEnv):
    data = await prepared_qcm_session(it_env.client, it_env.users.student_id, it_env.users.classmate_id)
    await login(it_env.client, STUDENT_EMAIL)
    await student_start_exam(it_env.client, data["session_id"])
    path = _tutor(data["session_id"], data["question_id"])
    during = await it_env.client.post(f"{path}/messages", json={"text": "מה התשובה?"})
    assert during.status_code == 403
    await student_submit_qcm(it_env.client, data["session_id"], data["question_id"], data["correct_option_id"])
    after_submit = await it_env.client.get(path)
    assert after_submit.status_code == 403
