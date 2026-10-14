"""Édition et suppression d'un cours catalogue."""

import pytest
from fastapi import HTTPException

from app.schemas.catalog import CatalogCourseUpdate
from app.services.catalog_lifecycle import (
    apply_catalog_fields,
    normalized_catalog_update,
    refuse_if_catalog_in_use,
)


def test_name_is_trimmed_and_blank_description_is_cleared():
    fields = normalized_catalog_update(CatalogCourseUpdate(name="  מבנים ", description="  "))
    assert fields == {"name": "מבנים", "description": None}


def test_blank_name_is_rejected():
    with pytest.raises(HTTPException) as exc:
        normalized_catalog_update(CatalogCourseUpdate(name="   "))
    assert exc.value.status_code == 400


def test_empty_update_is_rejected():
    with pytest.raises(HTTPException) as exc:
        normalized_catalog_update(CatalogCourseUpdate())
    assert exc.value.status_code == 400


def test_apply_writes_name_and_description():
    catalog = type("C", (), {"name": "", "description": "ישן"})()
    apply_catalog_fields(catalog, {"name": "חדש", "description": None})
    assert catalog.name == "חדש"
    assert catalog.description is None


def test_linked_content_blocks_deletion():
    refuse_if_catalog_in_use(0, 0, 0)
    with pytest.raises(HTTPException) as exc:
        refuse_if_catalog_in_use(1, 0, 0)
    assert exc.value.status_code == 400
