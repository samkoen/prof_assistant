import pytest

from tests.integration.conftest import ItEnv


@pytest.mark.integration
async def test_public_catalog_lists_prices_without_login(it_env: ItEnv):
    response = await it_env.client.get("/api/billing/catalog")
    assert response.status_code == 200
    prices = {pack["code"]: pack["price_ils"] for pack in response.json()["packs"]}
    assert prices == {
        "student_20": 19,
        "student_60": 45,
        "teacher_5": 29,
        "teacher_15": 69,
    }
    assert response.json()["calls_per_teacher_credit"] == 5
