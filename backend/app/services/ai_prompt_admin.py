"""CRUD admin du catalogue de prompts IA."""

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_prompt import AiPromptTemplate
from app.models.user import User
from app.schemas.ai_prompt import AiPromptTemplateOut
from app.services.ai_prompt_defaults import PROMPT_SPECS, PromptSpec, get_prompt_spec
from app.services.ai_prompt_render import missing_required_snippets
from app.services.ai_prompt_store import apply_cache_from_rows, refresh_prompt_cache, seed_missing_templates


def _to_out(row: AiPromptTemplate | None, spec: PromptSpec) -> AiPromptTemplateOut:
    body = row.body if row else spec.body
    updated = row.updated_at.isoformat() if row and row.updated_at else None
    return AiPromptTemplateOut(
        key=spec.key,
        body=body,
        version=row.version if row else 1,
        updated_at=updated,
        placeholders=list(spec.placeholders),
        required=list(spec.required),
        is_custom=body != spec.body,
    )


async def _reload_cache(db: AsyncSession) -> None:
    result = await db.execute(select(AiPromptTemplate))
    apply_cache_from_rows(list(result.scalars().all()))


async def list_ai_prompt_templates(db: AsyncSession) -> list[AiPromptTemplateOut]:
    await seed_missing_templates(db)
    await db.commit()
    result = await db.execute(select(AiPromptTemplate))
    rows = {row.key: row for row in result.scalars().all()}
    apply_cache_from_rows(list(rows.values()))
    return [_to_out(rows.get(spec.key), spec) for spec in PROMPT_SPECS]


async def _row_for_spec(db: AsyncSession, spec: PromptSpec) -> AiPromptTemplate:
    result = await db.execute(select(AiPromptTemplate).where(AiPromptTemplate.key == spec.key))
    row = result.scalar_one_or_none()
    if row:
        return row
    row = AiPromptTemplate(key=spec.key, body=spec.body, version=1)
    db.add(row)
    await db.flush()
    return row


def _require_spec(key: str) -> PromptSpec:
    spec = get_prompt_spec(key)
    if not spec:
        raise HTTPException(status_code=404, detail="תבנית לא נמצאה")
    return spec


def _assert_required(body: str, spec: PromptSpec) -> None:
    missing = missing_required_snippets(body, spec.required)
    if missing:
        raise HTTPException(status_code=400, detail=f"חסרים קטעים חובה: {', '.join(missing)}")


async def update_ai_prompt_template(
    key: str, body: str, user: User, db: AsyncSession
) -> AiPromptTemplateOut:
    spec = _require_spec(key)
    _assert_required(body, spec)
    row = await _row_for_spec(db, spec)
    row.body = body
    row.version = (row.version or 1) + 1
    row.updated_by_id = user.id
    await db.commit()
    await _reload_cache(db)
    return _to_out(row, spec)


async def reset_ai_prompt_template(key: str, user: User, db: AsyncSession) -> AiPromptTemplateOut:
    spec = _require_spec(key)
    row = await _row_for_spec(db, spec)
    row.body = spec.body
    row.version = (row.version or 1) + 1
    row.updated_by_id = user.id
    await db.commit()
    await _reload_cache(db)
    return _to_out(row, spec)


async def ensure_prompt_catalog(db: AsyncSession) -> None:
    await refresh_prompt_cache(db)
    await db.commit()
