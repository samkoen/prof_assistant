"""Édition et suppression d'une הרצה : champs nettoyés, blocage s'il y a des מבחנים."""

import pytest
from fastapi import HTTPException

from app.schemas.course import CourseOfferingUpdate
from app.services.offering_lifecycle import (
    apply_offering_fields,
    normalized_offering_fields,
    refuse_if_offering_has_exams,
)


def _body(**overrides) -> CourseOfferingUpdate:
    data = {
        "catalog_name": "  מבני נתונים ",
        "group_name": " א ",
        "academic_year": 2026,
        "semester": 1,
        "description": "  ",
    }
    data.update(overrides)
    return CourseOfferingUpdate(**data)


def test_fields_are_trimmed_and_blank_description_is_cleared():
    fields = normalized_offering_fields(_body())
    assert fields["catalog_name"] == "מבני נתונים"
    assert fields["group_name"] == "א"
    assert fields["description"] is None
    assert fields["academic_year"] == 2026


def test_blank_name_is_rejected():
    with pytest.raises(HTTPException) as exc:
        normalized_offering_fields(_body(catalog_name="   "))
    assert exc.value.status_code == 400


def test_apply_writes_catalog_and_group():
    offering = type("O", (), {})()
    catalog = type("C", (), {})()
    apply_offering_fields(offering, catalog, normalized_offering_fields(_body(description="תיאור")))
    assert catalog.name == "מבני נתונים"
    assert offering.group_name == "א"
    assert offering.description == "תיאור"


def test_exams_block_deletion():
    refuse_if_offering_has_exams(0)
    with pytest.raises(HTTPException) as exc:
        refuse_if_offering_has_exams(2)
    assert exc.value.status_code == 400
