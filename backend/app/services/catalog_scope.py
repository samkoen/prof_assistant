"""Filtrage et correspondance de la portée des contenus catalogue."""

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import CourseOffering
from app.models.enums import UserRole
from app.models.user import User


def _scope_value(item, field: str):
    return getattr(item, field, None)


def catalog_item_visible_to_teacher(item, teacher_id: int) -> bool:
    """Un prof peut voir/utiliser le contenu si la portée prof le permet."""
    scope_teacher = _scope_value(item, "scope_teacher_id")
    if scope_teacher is not None and scope_teacher != teacher_id:
        return False
    return True


def catalog_item_matches_offering(item, offering: CourseOffering) -> bool:
    """Le contenu peut être utilisé pour cette instance de cours."""
    if not catalog_item_visible_to_teacher(item, offering.teacher_id):
        return False
    year = _scope_value(item, "scope_academic_year")
    if year is not None and year != offering.academic_year:
        return False
    semester = _scope_value(item, "scope_semester")
    if semester is not None and semester != offering.semester:
        return False
    group = _scope_value(item, "scope_group_name")
    if group is not None and group != offering.group_name:
        return False
    return True


def teacher_can_edit_catalog_item(item, user: User, catalog_creator_id: int) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    if item.created_by_id == user.id:
        return True
    return catalog_creator_id == user.id


def apply_scope_fields(item, scope, created_by_id: int) -> None:
    item.created_by_id = created_by_id
    item.scope_teacher_id = scope.scope_teacher_id
    item.scope_academic_year = scope.scope_academic_year
    item.scope_semester = scope.scope_semester
    item.scope_group_name = scope.scope_group_name


def scope_teacher_filter(model, teacher_id: int):
    """SQLAlchemy filter: contenus visibles pour un prof (dimension prof)."""
    return or_(
        model.scope_teacher_id.is_(None),
        model.scope_teacher_id == teacher_id,
    )


async def load_scope_teacher_names(
    db: AsyncSession, items: list
) -> dict[int, str]:
    ids = {i.scope_teacher_id for i in items if i.scope_teacher_id is not None}
    ids |= {i.created_by_id for i in items if i.created_by_id is not None}
    if not ids:
        return {}
    result = await db.execute(select(User.id, User.full_name).where(User.id.in_(ids)))
    return {row.id: row.full_name for row in result.all()}
