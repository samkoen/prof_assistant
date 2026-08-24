import pytest

from tests.integration.conftest import ItEnv


@pytest.mark.integration
async def test_health_ok(it_env: ItEnv):
    response = await it_env.client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "app" in body
