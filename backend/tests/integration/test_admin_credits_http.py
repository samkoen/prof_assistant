import pytest

from tests.integration.conftest import ItEnv
from tests.integration.http_helpers import login, logout
from tests.integration.seed import ADMIN_EMAIL, STUDENT_EMAIL, TEACHER_EMAIL


@pytest.mark.integration
async def test_student_cannot_grant_own_credits(it_env: ItEnv):
    await login(it_env.client, STUDENT_EMAIL)
    response = await it_env.client.patch(
        f"/api/admin/users/{it_env.users.student_id}/credits",
        json={"credits": 9999},
    )
    assert response.status_code == 403


@pytest.mark.integration
async def test_teacher_cannot_grant_credits(it_env: ItEnv):
    await login(it_env.client, TEACHER_EMAIL)
    response = await it_env.client.patch(
        f"/api/admin/users/{it_env.users.student_id}/credits",
        json={"credits": 50},
    )
    assert response.status_code == 403


@pytest.mark.integration
async def test_anonymous_cannot_grant_credits(it_env: ItEnv):
    await logout(it_env.client)
    response = await it_env.client.patch(
        f"/api/admin/users/{it_env.users.student_id}/credits",
        json={"credits": 50},
    )
    assert response.status_code == 401


@pytest.mark.integration
async def test_admin_sets_and_lists_credits(it_env: ItEnv):
    await login(it_env.client, ADMIN_EMAIL)
    patched = await it_env.client.patch(
        f"/api/admin/users/{it_env.users.student_id}/credits",
        json={"credits": 17},
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["credits"] == 17
    listing = await it_env.client.get("/api/admin/users")
    assert listing.status_code == 200
    student = next(u for u in listing.json() if u["id"] == it_env.users.student_id)
    admin_row = next(u for u in listing.json() if u["id"] == it_env.users.admin_id)
    assert student["ai_credits"]["credits"] == 17
    assert admin_row["ai_credits"]["unlimited"] is True
    forbidden = await it_env.client.patch(
        f"/api/admin/users/{it_env.users.admin_id}/credits",
        json={"credits": 1},
    )
    assert forbidden.status_code == 400
