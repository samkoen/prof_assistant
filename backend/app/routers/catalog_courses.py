from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.course import CourseCatalog, CourseOffering
from app.models.enums import UserRole
from app.models.exercise import Exercise
from app.models.user import User
from app.schemas.catalog import (
    CatalogCourseCreate,
    CatalogCourseResponse,
    CatalogCourseUpdate,
    ExerciseCreate,
    ExerciseResponse,
)
from app.services.catalog_item_response import scope_to_response
from app.services.catalog_scope import (
    apply_scope_fields,
    catalog_item_matches_offering,
    load_scope_teacher_names,
    scope_teacher_filter,
)
from app.services.course_helpers import catalog_to_response

router = APIRouter(prefix="/catalog-courses", tags=["catalog-courses"])


async def _get_owned_catalog(catalog_id: int, user: User, db: AsyncSession) -> CourseCatalog:
    catalog = await db.get(CourseCatalog, catalog_id)
    if not catalog:
        raise HTTPException(status_code=404, detail="קורס קטלוג לא נמצא")
    if user.role != UserRole.ADMIN and catalog.created_by_id != user.id:
        raise HTTPException(status_code=403, detail="אין הרשאה")
    return catalog


def _exercise_response(exercise: Exercise, names: dict[int, str]) -> ExerciseResponse:
    return ExerciseResponse(
        id=exercise.id,
        catalog_course_id=exercise.catalog_course_id,
        title=exercise.title,
        description=exercise.description,
        created_at=exercise.created_at,
        **scope_to_response(exercise, names),
    )


@router.post("", response_model=CatalogCourseResponse)
async def create_catalog_course(
    body: CatalogCourseCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    catalog = CourseCatalog(name=body.name, description=body.description, created_by_id=user.id)
    db.add(catalog)
    await db.commit()
    await db.refresh(catalog)
    return await catalog_to_response(catalog, db)


@router.get("/mine", response_model=list[CatalogCourseResponse])
async def list_my_catalog_courses(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    q = select(CourseCatalog).order_by(CourseCatalog.name)
    if user.role == UserRole.TEACHER:
        q = q.where(CourseCatalog.created_by_id == user.id)
    result = await db.execute(q)
    catalogs = result.scalars().all()
    return [await catalog_to_response(c, db) for c in catalogs]


@router.get("/{catalog_id}", response_model=CatalogCourseResponse)
async def get_catalog_course(
    catalog_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    catalog = await _get_owned_catalog(catalog_id, user, db)
    return await catalog_to_response(catalog, db)


@router.patch("/{catalog_id}", response_model=CatalogCourseResponse)
async def update_catalog_course(
    catalog_id: int,
    body: CatalogCourseUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    catalog = await _get_owned_catalog(catalog_id, user, db)
    if body.name is not None:
        catalog.name = body.name
    if body.description is not None:
        catalog.description = body.description
    await db.commit()
    await db.refresh(catalog)
    return await catalog_to_response(catalog, db)


@router.get("/{catalog_id}/exercises", response_model=list[ExerciseResponse])
async def list_exercises(
    catalog_id: int,
    offering_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    await db.get(CourseCatalog, catalog_id)
    q = select(Exercise).where(Exercise.catalog_course_id == catalog_id)
    if user.role == UserRole.TEACHER:
        q = q.where(scope_teacher_filter(Exercise, user.id))
    result = await db.execute(q.order_by(Exercise.created_at.desc()))
    exercises = list(result.scalars().all())

    if offering_id is not None:
        offering = await db.get(CourseOffering, offering_id)
        if offering and offering.catalog_course_id == catalog_id:
            exercises = [e for e in exercises if catalog_item_matches_offering(e, offering)]

    names = await load_scope_teacher_names(db, exercises)
    return [_exercise_response(e, names) for e in exercises]


@router.post("/{catalog_id}/exercises", response_model=ExerciseResponse)
async def create_exercise(
    catalog_id: int,
    body: ExerciseCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.TEACHER, UserRole.ADMIN)),
):
    await _get_owned_catalog(catalog_id, user, db)
    if (
        body.scope_teacher_id is not None
        and user.role == UserRole.TEACHER
        and body.scope_teacher_id != user.id
    ):
        raise HTTPException(status_code=403, detail="לא ניתן להגביל למורה אחר")
    exercise = Exercise(
        catalog_course_id=catalog_id,
        title=body.title,
        description=body.description,
    )
    apply_scope_fields(exercise, body, user.id)
    db.add(exercise)
    await db.commit()
    await db.refresh(exercise)
    names = await load_scope_teacher_names(db, [exercise])
    return _exercise_response(exercise, names)
