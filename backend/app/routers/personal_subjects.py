from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.catalog import PersonalSubjectCreate
from app.schemas.course import CourseOfferingResponse
from app.services.course_helpers import offering_to_response
from app.services.personal_subject import create_personal_subject, load_offering

router = APIRouter(tags=["personal-subjects"])


@router.post("/student/subjects", response_model=CourseOfferingResponse)
async def create_student_subject(
    body: PersonalSubjectCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.STUDENT)),
):
    offering = await create_personal_subject(db, user, body.name, body.description)
    await db.commit()
    loaded = await load_offering(db, offering.id)
    return offering_to_response(loaded)
