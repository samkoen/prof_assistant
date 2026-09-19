import pytest

from tests.integration.conftest import ItEnv
from tests.integration.exam_flow import teacher_catalog_and_offering
from tests.integration.http_helpers import json_ok, login, logout
from tests.integration.seed import ADMIN_EMAIL, PASSWORD, STUDENT_EMAIL, TEACHER_EMAIL

CO_EMAIL = "coteacher.it@example.com"
CO2_EMAIL = "coteacher2.it@example.com"


async def admin_create_teacher(client, email: str, name: str) -> dict:
    await login(client, ADMIN_EMAIL)
    user = await json_ok(
        await client.post(
            "/api/admin/users",
            json={"email": email, "password": PASSWORD, "full_name": name, "role": "teacher"},
        )
    )
    await logout(client)
    return user


async def owner_new_offering(client) -> int:
    await login(client, TEACHER_EMAIL)
    _, offering_id = await teacher_catalog_and_offering(client)
    return offering_id


async def invite_teacher(client, offering_id: int, email: str) -> dict:
    return await json_ok(
        await client.post(
            f"/api/courses/{offering_id}/teacher-invites",
            json={"recipient_email": email},
        )
    )


async def invite_and_accept(client, offering_id: int, email: str) -> dict:
    await login(client, TEACHER_EMAIL)
    invite = await invite_teacher(client, offering_id, email)
    await logout(client)
    await login(client, email)
    return await json_ok(
        await client.post(f"/api/offering-teacher-invites/{invite['id']}/accept")
    )


def _json_list(response) -> list:
    assert response.status_code == 200, response.text
    body = response.json()
    assert isinstance(body, list)
    return body


def _offering_ids(rows: list[dict]) -> set[int]:
    return {row["id"] for row in rows}


def _roles_on(offering: dict) -> dict[int, str]:
    return {t["id"]: t["role"] for t in offering.get("teachers") or []}


@pytest.mark.integration
async def test_invite_accept_shows_on_mine(it_env: ItEnv):
    client = it_env.client
    colleague = await admin_create_teacher(client, CO_EMAIL, "Co Teacher")
    offering_id = await owner_new_offering(client)
    accepted = await invite_and_accept(client, offering_id, CO_EMAIL)
    assert accepted["status"] == "accepted"
    mine = _json_list(await client.get("/api/courses/mine"))
    assert offering_id in _offering_ids(mine)
    roles = _roles_on(next(o for o in mine if o["id"] == offering_id))
    assert roles[it_env.users.teacher_id] == "owner"
    assert roles[colleague["id"]] == "co_teacher"


@pytest.mark.integration
async def test_decline_does_not_grant_membership(it_env: ItEnv):
    client = it_env.client
    await admin_create_teacher(client, CO_EMAIL, "Co Teacher")
    offering_id = await owner_new_offering(client)
    invite = await invite_teacher(client, offering_id, CO_EMAIL)
    await logout(client)
    await login(client, CO_EMAIL)
    declined = await json_ok(
        await client.post(f"/api/offering-teacher-invites/{invite['id']}/decline")
    )
    assert declined["status"] == "declined"
    mine = _json_list(await client.get("/api/courses/mine"))
    assert offering_id not in _offering_ids(mine)


@pytest.mark.integration
async def test_co_teacher_cannot_invite_or_remove_owner(it_env: ItEnv):
    client = it_env.client
    await admin_create_teacher(client, CO_EMAIL, "Co Teacher")
    await admin_create_teacher(client, CO2_EMAIL, "Other Teacher")
    offering_id = await owner_new_offering(client)
    await invite_and_accept(client, offering_id, CO_EMAIL)
    forbidden_invite = await client.post(
        f"/api/courses/{offering_id}/teacher-invites",
        json={"recipient_email": CO2_EMAIL},
    )
    assert forbidden_invite.status_code == 403
    forbidden_remove = await client.delete(
        f"/api/courses/{offering_id}/teachers/{it_env.users.teacher_id}"
    )
    assert forbidden_remove.status_code == 403


@pytest.mark.integration
async def test_outsider_cannot_see_enrollments(it_env: ItEnv):
    client = it_env.client
    await admin_create_teacher(client, CO_EMAIL, "Co Teacher")
    offering_id = await owner_new_offering(client)
    await logout(client)
    await login(client, CO_EMAIL)
    response = await client.get(f"/api/courses/{offering_id}/enrollments")
    assert response.status_code == 404


@pytest.mark.integration
async def test_student_finds_offering_via_co_teacher_email(it_env: ItEnv):
    client = it_env.client
    await admin_create_teacher(client, CO_EMAIL, "Co Teacher")
    offering_id = await owner_new_offering(client)
    await logout(client)
    await login(client, STUDENT_EMAIL)
    before = await json_ok(await client.get("/api/courses/by-teacher-email", params={"email": CO_EMAIL}))
    assert before["offerings"] == []
    await invite_and_accept(client, offering_id, CO_EMAIL)
    await logout(client)
    await login(client, STUDENT_EMAIL)
    after = await json_ok(await client.get("/api/courses/by-teacher-email", params={"email": CO_EMAIL}))
    assert offering_id in _offering_ids(after["offerings"])


@pytest.mark.integration
async def test_enrollment_notifies_owner_and_co_teacher(it_env: ItEnv):
    client = it_env.client
    await admin_create_teacher(client, CO_EMAIL, "Co Teacher")
    offering_id = await owner_new_offering(client)
    await invite_and_accept(client, offering_id, CO_EMAIL)
    await logout(client)
    await login(client, STUDENT_EMAIL)
    await json_ok(await client.post("/api/enrollments/request", json={"offering_id": offering_id}))
    await logout(client)
    owner_notes = await _enrollment_request_count(client, TEACHER_EMAIL)
    co_notes = await _enrollment_request_count(client, CO_EMAIL)
    assert owner_notes >= 1
    assert co_notes >= 1


async def _enrollment_request_count(client, email: str) -> int:
    await login(client, email)
    notes = _json_list(await client.get("/api/notifications"))
    await logout(client)
    return sum(1 for n in notes if n["type"] == "enrollment_requested")


@pytest.mark.integration
async def test_owner_can_invite_two_colleagues(it_env: ItEnv):
    client = it_env.client
    first = await admin_create_teacher(client, CO_EMAIL, "Co Teacher")
    second = await admin_create_teacher(client, CO2_EMAIL, "Other Teacher")
    offering_id = await owner_new_offering(client)
    await invite_and_accept(client, offering_id, CO_EMAIL)
    await logout(client)
    await invite_and_accept(client, offering_id, CO2_EMAIL)
    await login(client, TEACHER_EMAIL)
    payload = await json_ok(await client.get(f"/api/courses/{offering_id}/teachers"))
    ids = {t["id"] for t in payload["teachers"]}
    assert ids == {it_env.users.teacher_id, first["id"], second["id"]}


@pytest.mark.integration
async def test_leave_and_owner_remove(it_env: ItEnv):
    client = it_env.client
    colleague = await admin_create_teacher(client, CO_EMAIL, "Co Teacher")
    extra = await admin_create_teacher(client, CO2_EMAIL, "Other Teacher")
    offering_id = await owner_new_offering(client)
    await invite_and_accept(client, offering_id, CO_EMAIL)
    await json_ok(await client.post(f"/api/courses/{offering_id}/teachers/me/leave"))
    assert offering_id not in _offering_ids(_json_list(await client.get("/api/courses/mine")))
    await logout(client)
    await invite_and_accept(client, offering_id, CO2_EMAIL)
    await logout(client)
    await login(client, TEACHER_EMAIL)
    await json_ok(await client.delete(f"/api/courses/{offering_id}/teachers/{extra['id']}"))
    payload = await json_ok(await client.get(f"/api/courses/{offering_id}/teachers"))
    assert extra["id"] not in {t["id"] for t in payload["teachers"]}
    assert colleague["id"] not in {t["id"] for t in payload["teachers"]}


@pytest.mark.integration
async def test_invite_self_and_duplicate_pending(it_env: ItEnv):
    client = it_env.client
    await admin_create_teacher(client, CO_EMAIL, "Co Teacher")
    offering_id = await owner_new_offering(client)
    self_invite = await client.post(
        f"/api/courses/{offering_id}/teacher-invites",
        json={"recipient_email": TEACHER_EMAIL},
    )
    assert self_invite.status_code == 400
    await invite_teacher(client, offering_id, CO_EMAIL)
    again = await client.post(
        f"/api/courses/{offering_id}/teacher-invites",
        json={"recipient_email": CO_EMAIL},
    )
    assert again.status_code == 400
