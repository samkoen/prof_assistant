"""Portée optionnelle d'un contenu catalogue (examen, exercice).

Chaque champ NULL = pas de restriction sur cette dimension.
"""

from pydantic import BaseModel, Field


class CatalogItemScopeFields(BaseModel):
    scope_teacher_id: int | None = None
    scope_academic_year: int | None = Field(default=None, ge=2000, le=2100)
    scope_semester: int | None = Field(default=None, ge=1, le=3)
    scope_group_name: str | None = Field(default=None, max_length=255)


class CatalogItemScopeResponse(CatalogItemScopeFields):
    created_by_id: int
    created_by_name: str | None = None
    scope_teacher_name: str | None = None

    model_config = {"from_attributes": True}
