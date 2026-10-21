import pytest

from tests.integration.conftest import ItEnv
from tests.integration.exam_flow import teacher_catalog_and_offering
from tests.integration.http_helpers import json_ok, login
from tests.integration.seed import TEACHER_EMAIL


@pytest.mark.integration
async def test_attaching_a_ready_task_opens_the_new_group(it_env: ItEnv):
    client = it_env.client
    await login(client, TEACHER_EMAIL)
    catalog_id, _offering_id = await teacher_catalog_and_offering(client)
    exam = await json_ok(
        await client.post(
            "/api/exams",
            json={
                "catalog_course_id": catalog_id,
                "title": "משימה",
                "kind": "task",
                "shuffle_questions": False,
                "shuffle_options": False,
                "is_tirgoul": False,
            },
        )
    )
    await json_ok(
        await client.post(
            f"/api/exams/{exam['id']}/steps",
            json={"title": "צילום", "instructions": "הראה את המסך", "max_points": 2},
        )
    )
    second = await json_ok(
        await client.post(
            "/api/courses",
            json={
                "catalog_course_id": catalog_id,
                "group_name": "ב",
                "academic_year": 2026,
                "semester": 1,
            },
        )
    )
    await json_ok(
        await client.post(f"/api/exams/{exam['id']}/attach-offering", json={"offering_id": second["id"]})
    )
    sessions = await json_ok(await client.get("/api/exams/sessions/mine"))
    attached = next(row for row in sessions if row["exam_id"] == exam["id"] and row["offering_id"] == second["id"])
    assert attached["status"] == "draft"
    assert attached["grading_locked"] is False
    deployed = await json_ok(await client.post(f"/api/exams/sessions/{attached['id']}/deploy"))
    assert deployed["status"] == "active"
