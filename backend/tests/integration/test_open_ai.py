import pytest

from tests.integration.ai_mocks import MODEL_ANSWER_TEXT
from tests.integration.conftest import ItEnv
from tests.integration.exam_flow import published_open_attempt, teacher_catalog_and_offering
from tests.integration.http_helpers import json_ok, login
from tests.integration.seed import STUDENT_EMAIL, TEACHER_EMAIL


@pytest.mark.integration
async def test_open_evaluate_uses_mocked_ai(it_env: ItEnv):
    exam = await published_open_attempt(it_env.client, it_env.users.student_id)
    await login(it_env.client, STUDENT_EMAIL)
    path = (
        f"/api/exams/sessions/{exam['session_id']}"
        f"/questions/{exam['question_id']}/open-evaluate"
    )
    body = await json_ok(await it_env.client.post(path, json={"regenerate": False}))
    assert body["from_cache"] is False
    assert body["suggested_score"] == 1.5
    assert "הגעת לעיקר" in body["appreciation"]
    assert body["attempt_score"] == 1.5
    assert body["attempt_max_score"] == 2
    cached = await json_ok(await it_env.client.post(path, json={"regenerate": False}))
    assert cached["from_cache"] is True
    assert cached["suggested_score"] == 1.5


@pytest.mark.integration
async def test_teacher_model_answer_uses_mocked_ai(it_env: ItEnv):
    await login(it_env.client, TEACHER_EMAIL)
    catalog_id, _offering_id = await teacher_catalog_and_offering(it_env.client)
    exam = await json_ok(
        await it_env.client.post(
            "/api/exams",
            json={
                "catalog_course_id": catalog_id,
                "title": "IT model answer",
                "shuffle_questions": False,
                "shuffle_options": False,
            },
        )
    )
    body = await json_ok(
        await it_env.client.post(
            f"/api/exams/{exam['id']}/open-model-answer",
            json={"question_text": "מהו ArrayList?", "language": "he"},
        )
    )
    assert body["model_answer"] == MODEL_ANSWER_TEXT
