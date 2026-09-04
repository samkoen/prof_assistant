import pytest

from tests.integration.conftest import ItEnv
from tests.integration.exam_flow import (
    add_single_question,
    create_draft_exam,
    enroll_student,
    exam_token_headers,
    prepared_qcm_session,
    student_start_exam,
    student_submit_qcm,
    teacher_catalog_and_offering,
)
from tests.integration.http_helpers import json_ok, login, logout
from tests.integration.seed import STUDENT_EMAIL, TEACHER_EMAIL


async def _prepared_tirgoul(client, student_id: int) -> dict:
    await login(client, TEACHER_EMAIL)
    catalog_id, offering_id = await teacher_catalog_and_offering(client)
    exam = await create_draft_exam(
        client, catalog_id, offering_id, title="תרגול IT", is_tirgoul=True
    )
    qcm = await add_single_question(client, exam["id"])
    await enroll_student(client, offering_id, student_id)
    sessions = await json_ok(await client.get(f"/api/exams/sessions/mine"))
    session = next(s for s in sessions if s["exam_id"] == exam["id"])
    await logout(client)
    return {
        "exam_id": exam["id"],
        "session_id": session["id"],
        "offering_id": offering_id,
        **qcm,
    }


@pytest.mark.integration
async def test_official_activate_enables_integrity(it_env: ItEnv):
    ctx = await prepared_qcm_session(
        it_env.client, it_env.users.student_id, it_env.users.classmate_id
    )
    await login(it_env.client, TEACHER_EMAIL)
    sessions = await json_ok(await it_env.client.get("/api/exams/sessions/mine"))
    session = next(s for s in sessions if s["id"] == ctx["session_id"])
    assert session["integrity_mode_enabled"] is True
    exam = await json_ok(await it_env.client.get(f"/api/exams/{ctx['exam_id']}"))
    assert exam["shuffle_questions"] is True
    assert exam["shuffle_options"] is True
    assert exam["is_tirgoul"] is False


@pytest.mark.integration
async def test_tirgoul_opens_without_activate_and_shows_score(it_env: ItEnv):
    ctx = await _prepared_tirgoul(it_env.client, it_env.users.student_id)
    await login(it_env.client, TEACHER_EMAIL)
    exam = await json_ok(await it_env.client.get(f"/api/exams/{ctx['exam_id']}"))
    assert exam["is_tirgoul"] is True
    assert exam["shuffle_questions"] is False
    assert exam["is_editable"] is True
    sessions = await json_ok(await it_env.client.get("/api/exams/sessions/mine"))
    session = next(s for s in sessions if s["id"] == ctx["session_id"])
    assert session["status"] == "active"
    assert session["integrity_mode_enabled"] is False
    close = await it_env.client.post(f"/api/exams/sessions/{ctx['session_id']}/close")
    assert close.status_code == 400
    await logout(it_env.client)
    await login(it_env.client, STUDENT_EMAIL)
    take = await student_start_exam(it_env.client, ctx["session_id"])
    assert take["is_tirgoul"] is True
    assert take["attempt"]["expires_at"] is None
    submitted = await student_submit_qcm(
        it_env.client, ctx["session_id"], ctx["question_id"], ctx["correct_option_id"]
    )
    assert submitted["score"] == 1
    assert submitted["can_resubmit"] is True
    review = await json_ok(await it_env.client.get(f"/api/exams/sessions/{ctx['session_id']}/review"))
    assert review["show_correction"] is True


@pytest.mark.integration
async def test_tirgoul_retry_replaces_score(it_env: ItEnv):
    ctx = await _prepared_tirgoul(it_env.client, it_env.users.student_id)
    await login(it_env.client, STUDENT_EMAIL)
    await student_start_exam(it_env.client, ctx["session_id"])
    first = await student_submit_qcm(
        it_env.client, ctx["session_id"], ctx["question_id"], ctx["correct_option_id"]
    )
    assert first["score"] == 1
    await json_ok(
        await it_env.client.post(
            f"/api/exams/sessions/{ctx['session_id']}/open",
            headers=exam_token_headers(ctx["session_id"]),
        )
    )
    take = await json_ok(
        await it_env.client.get(
            f"/api/exams/sessions/{ctx['session_id']}/take",
            headers=exam_token_headers(ctx["session_id"]),
        )
    )
    assert take["attempt"]["submitted_at"] is None
    assert take["attempt"]["score"] is None
    wrong = next(
        opt["id"]
        for opt in take["questions"][0]["options"]
        if opt["id"] != ctx["correct_option_id"]
    )
    second = await student_submit_qcm(it_env.client, ctx["session_id"], ctx["question_id"], wrong)
    assert second["score"] == 0


@pytest.mark.integration
async def test_tirgoul_opens_matching_offerings_without_offering_id(it_env: ItEnv):
    client = it_env.client
    await login(client, TEACHER_EMAIL)
    catalog_id, offering_id = await teacher_catalog_and_offering(client)
    exam = await create_draft_exam(client, catalog_id, offering_id=None, title="תרגול כללי", is_tirgoul=True)
    await add_single_question(client, exam["id"])
    sessions = await json_ok(await client.get("/api/exams/sessions/mine"))
    session = next(s for s in sessions if s["exam_id"] == exam["id"])
    assert session["offering_id"] == offering_id
    assert session["status"] == "active"
    assert session["integrity_mode_enabled"] is False


@pytest.mark.integration
async def test_duplicated_tirgoul_opens_for_matching_offerings(it_env: ItEnv):
    client = it_env.client
    await login(client, TEACHER_EMAIL)
    catalog_id, offering_id = await teacher_catalog_and_offering(client)
    exam = await create_draft_exam(
        client, catalog_id, offering_id, title="תרגול מקור", is_tirgoul=True
    )
    await add_single_question(client, exam["id"])
    copy = await json_ok(await client.post(f"/api/exams/{exam['id']}/duplicate"))
    assert copy["is_tirgoul"] is True
    sessions = await json_ok(await client.get("/api/exams/sessions/mine"))
    copied = next(s for s in sessions if s["exam_id"] == copy["id"])
    assert copied["offering_id"] == offering_id
    assert copied["status"] == "active"
    assert copied["integrity_mode_enabled"] is False
