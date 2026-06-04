from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.catalog_scope import CatalogItemScopeFields, CatalogItemScopeResponse


class CatalogCourseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    teacher_id: int | None = None


class CatalogCourseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None


class CatalogCourseResponse(BaseModel):
    id: int
    name: str
    description: str | None
    teacher_id: int
    teacher_name: str
    exam_count: int = 0
    exercise_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class ExerciseCreate(CatalogItemScopeFields):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None


class ExerciseResponse(CatalogItemScopeResponse):
    id: int
    catalog_course_id: int
    title: str
    description: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
