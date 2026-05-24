"""Helpers de réponse pour examens/exercices catalogue."""

from app.schemas.catalog_scope import CatalogItemScopeResponse
from app.services.catalog_scope import load_scope_teacher_names


def scope_to_response(item, names: dict[int, str]) -> dict:
    return {
        "created_by_id": item.created_by_id,
        "created_by_name": names.get(item.created_by_id),
        "scope_teacher_id": item.scope_teacher_id,
        "scope_teacher_name": names.get(item.scope_teacher_id) if item.scope_teacher_id else None,
        "scope_academic_year": item.scope_academic_year,
        "scope_semester": item.scope_semester,
        "scope_group_name": item.scope_group_name,
    }


async def enrich_scope_responses(db, items: list) -> dict[int, dict]:
    names = await load_scope_teacher_names(db, items)
    return {item.id: scope_to_response(item, names) for item in items}
