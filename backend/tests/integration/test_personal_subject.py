import pytest

from tests.integration.conftest import ItEnv
from tests.integration.exam_flow import add_single_question, create_draft_exam
from tests.integration.http_helpers import json_ok, login, logout
from tests.integration.seed import CLASSMATE_EMAIL, STUDENT_EMAIL, TEACHER_EMAIL


async def _create_subject(client, name: str = "אלגברה אישית") -> dict:
    return await json_ok(
        await client.post("/api/student/subjects", json={"name": name, "description": "לבד"}),
        status=200,
    )


async def _owned_tirgoul(client, catalog_id: int, offering_id: int) -> dict:
    exam = await create_draft_exam(client, catalog_id, offering_id, title="תרגול אישי", is_tirgoul=True)
    await add_single_question(client, exam["id"])
    return exam


@pytest.mark.integration
async def test_personal_subject_is_private_and_tirgoul_only(it_env: ItEnv):
    client = it_env.client
    await login(client, STUDENT_EMAIL)
    subject = await _create_subject(client)
    assert subject["is_personal"] is True
    assert subject["is_open_enrollment"] is False
    assert subject["teacher_name"] == ""
    assert subject["join_token"] is None
    refused = await client.post(
        "/api/exams",
        json={
            "catalog_course_id": subject["catalog_course_id"],
            "offering_id": subject["id"],
            "title": "מבחן",
            "shuffle_questions": True,
            "shuffle_options": True,
            "is_tirgoul": False,
        },
    )
    assert refused.status_code == 403
    exam = await _owned_tirgoul(client, subject["catalog_course_id"], subject["id"])
    assert exam["is_tirgoul"] is True
    assert exam["scope_teacher_id"] is None
    await logout(client)

    await login(client, CLASSMATE_EMAIL)
    other = await client.post(
        "/api/exams",
        json={
            "catalog_course_id": subject["catalog_course_id"],
            "title": "לא שלי",
            "shuffle_questions": False,
            "shuffle_options": True,
            "is_tirgoul": True,
        },
    )
    assert other.status_code == 403
    await logout(client)

    await login(client, TEACHER_EMAIL)
    mine = await json_ok(await client.get("/api/courses/mine"))
    assert all(row["id"] != subject["id"] for row in mine)
    await logout(client)


@pytest.mark.integration
async def test_share_tirgoul_to_student_and_subject_to_teacher(it_env: ItEnv):
    client = it_env.client
    await login(client, STUDENT_EMAIL)
    subject = await _create_subject(client, "פיזיקה אישית")
    exam = await _owned_tirgoul(client, subject["catalog_course_id"], subject["id"])
    self_share = await client.post(
        "/api/teacher-shares",
        json={"recipient_email": STUDENT_EMAIL, "share_type": "exam", "exam_id": exam["id"]},
    )
    assert self_share.status_code == 400
    sent = await json_ok(
        await client.post(
            "/api/teacher-shares",
            json={"recipient_email": CLASSMATE_EMAIL, "share_type": "exam", "exam_id": exam["id"]},
        )
    )
    catalog_share = await json_ok(
        await client.post(
            "/api/teacher-shares",
            json={
                "recipient_email": TEACHER_EMAIL,
                "share_type": "catalog",
                "catalog_id": subject["catalog_course_id"],
            },
        )
    )
    await logout(client)

    await login(client, CLASSMATE_EMAIL)
    await json_ok(
        await client.post(
            f"/api/teacher-shares/{sent['id']}/accept",
            json={"new_catalog_name": "עותק תלמיד"},
        )
    )
    catalogs = await json_ok(await client.get("/api/catalog-courses/mine"))
    copy = next(c for c in catalogs if c["name"] == "עותק תלמיד")
    assert copy["teacher_id"] is None
    exams = await json_ok(await client.get(f"/api/exams/catalog/{copy['id']}"))
    assert exams[0]["is_tirgoul"] is True
    assert exams[0]["scope_teacher_id"] is None
    assert exams[0]["created_by_id"] == it_env.users.classmate_id
    await logout(client)

    await login(client, TEACHER_EMAIL)
    await json_ok(
        await client.post(
            f"/api/teacher-shares/{catalog_share['id']}/accept",
            json={"new_catalog_name": "עותק מורה"},
        )
    )
    teacher_catalogs = await json_ok(await client.get("/api/catalog-courses/mine"))
    teacher_copy = next(c for c in teacher_catalogs if c["name"] == "עותק מורה")
    assert teacher_copy["teacher_id"] == it_env.users.teacher_id
    await logout(client)

    await login(client, STUDENT_EMAIL)
    original = await json_ok(await client.get("/api/catalog-courses/mine"))
    source = next(c for c in original if c["id"] == subject["catalog_course_id"])
    assert source["teacher_id"] is None
    await logout(client)
