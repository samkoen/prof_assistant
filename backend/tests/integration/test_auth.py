import pytest

from tests.integration.conftest import ItEnv
from tests.integration.http_helpers import login, logout
from tests.integration.seed import STUDENT_EMAIL


@pytest.mark.integration
async def test_login_and_me(it_env: ItEnv):
    await login(it_env.client, STUDENT_EMAIL)
    me = await it_env.client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == STUDENT_EMAIL
    assert me.json()["role"] == "student"


@pytest.mark.integration
async def test_login_rejects_bad_password(it_env: ItEnv):
    response = await it_env.client.post(
        "/api/auth/login",
        json={"email": STUDENT_EMAIL, "password": "wrong-password"},
    )
    assert response.status_code == 401


@pytest.mark.integration
async def test_me_requires_auth(it_env: ItEnv):
    await logout(it_env.client)
    response = await it_env.client.get("/api/auth/me")
    assert response.status_code in (401, 403)
