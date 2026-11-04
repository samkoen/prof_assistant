"""Appels REST Moodle. Le jeton voyage dans le corps, jamais dans l'URL ni les logs."""

from __future__ import annotations

import logging

import httpx

from app.integrations.moodle.grades import grade_fields
from app.integrations.moodle.parse import MoodleApiError, raise_if_moodle_error

logger = logging.getLogger(__name__)

_CHUNK = 50


async def call_moodle(
    base_url: str,
    token: str,
    function: str,
    params: list[tuple[str, str]] | None = None,
) -> object:
    form = [
        ("wstoken", token),
        ("wsfunction", function),
        ("moodlewsrestformat", "json"),
        *(params or []),
    ]
    try:
        payload = await _post(f"{base_url}/webservice/rest/server.php", form)
    except httpx.HTTPError as exc:
        logger.warning("Moodle call %s unreachable", function)
        raise MoodleApiError("Moodle לא זמין") from exc
    raise_if_moodle_error(payload)
    return payload


async def push_assignment_grades(
    base_url: str,
    token: str,
    assignment_id: int,
    grades: list[tuple[int, float]],
) -> None:
    for start in range(0, len(grades), _CHUNK):
        chunk = grades[start : start + _CHUNK]
        await call_moodle(
            base_url, token, "mod_assign_save_grades", grade_fields(assignment_id, chunk)
        )


async def _post(url: str, form: list[tuple[str, str]]) -> object:
    async with httpx.AsyncClient(timeout=20.0, follow_redirects=False) as client:
        response = await client.post(url, data=form)
    if response.status_code >= 400:
        logger.warning("Moodle HTTP %s", response.status_code)
        raise MoodleApiError(f"Moodle HTTP {response.status_code}")
    try:
        return response.json()
    except ValueError as exc:
        raise MoodleApiError("תשובת Moodle אינה תקינה") from exc
