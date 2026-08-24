"""Cache mémoire des prompts IA chargés depuis la base."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_prompt import AiPromptTemplate
from app.services.ai_prompt_defaults import PROMPT_SPECS, default_prompt_body

_cache: dict[str, str] | None = None


def get_prompt_body(key: str) -> str:
    default = default_prompt_body(key)
    if _cache is None:
        return default
    return _cache.get(key, default)


def override_prompt_cache(mapping: dict[str, str] | None) -> None:
    """None = retomber sur les défauts. Dict partiel = overlay sur les défauts."""
    global _cache
    if mapping is None:
        _cache = None
        return
    data = {spec.key: spec.body for spec in PROMPT_SPECS}
    data.update(mapping)
    _cache = data


def _defaults_map() -> dict[str, str]:
    return {spec.key: spec.body for spec in PROMPT_SPECS}


def apply_cache_from_rows(rows: list[AiPromptTemplate]) -> None:
    global _cache
    data = _defaults_map()
    for row in rows:
        if row.key in data:
            data[row.key] = row.body
    _cache = data


async def seed_missing_templates(db: AsyncSession) -> None:
    existing = await db.execute(select(AiPromptTemplate.key))
    have = set(existing.scalars().all())
    for spec in PROMPT_SPECS:
        if spec.key in have:
            continue
        db.add(AiPromptTemplate(key=spec.key, body=spec.body, version=1))


async def refresh_prompt_cache(db: AsyncSession) -> None:
    await seed_missing_templates(db)
    result = await db.execute(select(AiPromptTemplate))
    apply_cache_from_rows(list(result.scalars().all()))
