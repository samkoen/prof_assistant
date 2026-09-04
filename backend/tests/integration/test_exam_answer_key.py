import pytest

from tests.integration.conftest import ItEnv
from tests.integration.exam_flow import prepared_qcm_session, student_start_exam, student_submit_qcm
from tests.integration.http_helpers import json_ok, login, logout
from tests.integration.seed import STUDENT_EMAIL, TEACHER_EMAIL


def _other_option_id(question: dict, correct_id: int) -> int:
    return next(opt["id"] for opt in question["options"] if opt["id"] != correct_id)


def _option_text(question: dict, option_id: int) -> str:
    return next(opt["text"] for opt in question["options"] if opt["id"] == option_id)


async def _close_session(client, session_id: int) -> None:
    await json_ok(await client.post(f"/api/exams/sessions/{session_id}/close"))


async def _flip_key(client, exam_id: int, question_id: int, new_correct_id: int) -> dict:
    return await json_ok(
        await client.post(
            f"/api/exams/{exam_id}/answer-key",
            json={"questions": [{"question_id": question_id, "correct_option_ids": [new_correct_id]}]},
        )
    )


async def _student_submits_wrong(client, ctx: dict, wrong: int) -> None:
    await logout(client)
    await login(client, STUDENT_EMAIL)
    await student_start_exam(client, ctx["session_id"])
    submitted = await student_submit_qcm(client, ctx["session_id"], ctx["question_id"], wrong)
    assert submitted["submitted_at"] is not None
    await logout(client)
    await login(client, TEACHER_EMAIL)


async def _session_score(client, session_id: int, student_id: int) -> float | None:
    results = await json_ok(await client.get(f"/api/exams/sessions/{session_id}/results"))
    by_id = {row["student_id"]: row for row in results["results"]}
    return by_id[student_id]["score"]


def _assert_key_ids_kept(updated: dict, wrong: int, old_id: int, option_ids: set[int]) -> None:
    opts = {opt["id"]: opt["is_correct"] for opt in updated["questions"][0]["options"]}
    assert set(opts) == option_ids
    assert opts[wrong] is True
    assert opts[old_id] is False


async def _assert_duplicate_keeps_key(client, exam_id: int, question: dict, wrong: int, old_id: int) -> None:
    copy = await json_ok(await client.post(f"/api/exams/{exam_id}/duplicate"))
    copied = await json_ok(await client.get(f"/api/exams/{copy['id']}"))
    copied_opts = {opt["text"]: opt["is_correct"] for opt in copied["questions"][0]["options"]}
    assert copied_opts[_option_text(question, wrong)] is True
    assert copied_opts[_option_text(question, old_id)] is False


@pytest.mark.integration
async def test_answer_key_blocked_while_session_active(it_env: ItEnv):
    ctx = await prepared_qcm_session(
        it_env.client, it_env.users.student_id, it_env.users.classmate_id
    )
    await login(it_env.client, TEACHER_EMAIL)
    exam = await json_ok(await it_env.client.get(f"/api/exams/{ctx['exam_id']}"))
    question = exam["questions"][0]
    wrong = _other_option_id(question, ctx["correct_option_id"])
    response = await it_env.client.post(
        f"/api/exams/{ctx['exam_id']}/answer-key",
        json={"questions": [{"question_id": question["id"], "correct_option_ids": [wrong]}]},
    )
    assert response.status_code == 400
    results = await json_ok(await it_env.client.get(f"/api/exams/sessions/{ctx['session_id']}/results"))
    assert results["can_correct_answer_key"] is False


@pytest.mark.integration
async def test_answer_key_regrades_submitted_copies(it_env: ItEnv):
    ctx = await prepared_qcm_session(
        it_env.client, it_env.users.student_id, it_env.users.classmate_id
    )
    await login(it_env.client, TEACHER_EMAIL)
    exam = await json_ok(await it_env.client.get(f"/api/exams/{ctx['exam_id']}"))
    question = exam["questions"][0]
    wrong = _other_option_id(question, ctx["correct_option_id"])
    option_ids = {opt["id"] for opt in question["options"]}
    await _student_submits_wrong(it_env.client, ctx, wrong)
    await _close_session(it_env.client, ctx["session_id"])
    assert await _session_score(it_env.client, ctx["session_id"], it_env.users.student_id) == 0
    patched = await _flip_key(it_env.client, ctx["exam_id"], question["id"], wrong)
    assert patched["questions_updated"] == 1
    assert patched["regraded_attempts"] == 1
    results = await json_ok(await it_env.client.get(f"/api/exams/sessions/{ctx['session_id']}/results"))
    assert results["can_correct_answer_key"] is True
    assert await _session_score(it_env.client, ctx["session_id"], it_env.users.student_id) == 1
    updated = await json_ok(await it_env.client.get(f"/api/exams/{ctx['exam_id']}"))
    _assert_key_ids_kept(updated, wrong, ctx["correct_option_id"], option_ids)
    await _assert_duplicate_keeps_key(it_env.client, ctx["exam_id"], question, wrong, ctx["correct_option_id"])
