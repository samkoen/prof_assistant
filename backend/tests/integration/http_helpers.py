from httpx import AsyncClient, Response

from tests.integration.seed import PASSWORD


async def login(client: AsyncClient, email: str) -> Response:
    response = await client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    assert response.status_code == 200, response.text
    return response


async def logout(client: AsyncClient) -> None:
    response = await client.post("/api/auth/logout")
    assert response.status_code == 200, response.text


async def json_ok(response: Response, *, status: int = 200) -> dict:
    assert response.status_code == status, response.text
    return response.json()
