"""Partage d'examens et de cours catalogue entre professeurs."""

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course import CourseCatalog
from app.models.enums import NotificationType, TeacherShareStatus, TeacherShareType, UserRole
from app.models.exam import Exam
from app.models.notification import Notification
from app.models.teacher_share import TeacherContentShare
from app.models.user import User
from app.schemas.teacher_share import TeacherShareAccept, TeacherShareCreate, TeacherShareResponse
from app.services.catalog_teacher import teacher_owns_catalog
from app.services.exam_kind import apply_exam_kind, is_tirgoul
from app.services.exam_lifecycle import duplicate_exam_to_catalog, open_tirgoul_sessions_if_ready
from app.services.personal_subject import create_personal_subject


async def find_teacher_by_email(db: AsyncSession, email: str) -> User:
    result = await db.execute(
        select(User).where(User.email == email.strip().lower(), User.role == UserRole.TEACHER)
    )
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="מורה לא נמצא — בדקו את האימייל")
    return teacher


async def find_share_recipient(db: AsyncSession, email: str) -> User:
    result = await db.execute(
        select(User).where(
            User.email == email.strip().lower(),
            User.role.in_((UserRole.TEACHER, UserRole.STUDENT)),
        )
    )
    recipient = result.scalar_one_or_none()
    if not recipient:
        raise HTTPException(status_code=404, detail="משתמש לא נמצא — בדקו את האימייל")
    return recipient


def _sender_owns(catalog: CourseCatalog | None, sender_id: int) -> bool:
    if not catalog:
        return False
    return catalog.teacher_id == sender_id or catalog.owner_student_id == sender_id


async def _load_sender_exam(exam_id: int, sender_id: int, db: AsyncSession) -> Exam:
    result = await db.execute(
        select(Exam)
        .options(selectinload(Exam.catalog_course))
        .where(Exam.id == exam_id)
    )
    exam = result.scalar_one_or_none()
    if not exam or not exam.catalog_course:
        raise HTTPException(status_code=404, detail="מטלה לא נמצאה")
    if not _sender_owns(exam.catalog_course, sender_id):
        raise HTTPException(status_code=403, detail="אין הרשאה")
    return exam


async def _load_sender_catalog(catalog_id: int, sender_id: int, db: AsyncSession) -> CourseCatalog:
    catalog = await db.get(CourseCatalog, catalog_id)
    if not _sender_owns(catalog, sender_id):
        raise HTTPException(status_code=404, detail="קורס קטלוג לא נמצא")
    return catalog


async def _notify_share_received(db: AsyncSession, recipient_id: int, share_id: int, title: str) -> None:
    db.add(
        Notification(
            user_id=recipient_id,
            type=NotificationType.TEACHER_SHARE_RECEIVED,
            title=title,
            body="לחצו לקבלה ובחירת קורס קטלוג יעד",
            related_exam_id=None,
        )
    )


async def create_teacher_share(
    body: TeacherShareCreate, sender: User, db: AsyncSession
) -> TeacherContentShare:
    recipient = await find_share_recipient(db, body.recipient_email)
    if recipient.id == sender.id:
        raise HTTPException(status_code=400, detail="לא ניתן לשתף עם עצמך")

    share = TeacherContentShare(
        sender_id=sender.id,
        recipient_id=recipient.id,
        share_type=body.share_type.value,
        status=TeacherShareStatus.PENDING.value,
        message=body.message,
    )
    if body.share_type == TeacherShareType.EXAM:
        if not body.exam_id:
            raise HTTPException(status_code=400, detail="חסר מזהה מטלה")
        await _load_sender_exam(body.exam_id, sender.id, db)
        share.source_exam_id = body.exam_id
        notif_title = "שיתוף מטלה ממתין"
    else:
        if not body.catalog_id:
            raise HTTPException(status_code=400, detail="חסר מזהה קורס קטלוג")
        await _load_sender_catalog(body.catalog_id, sender.id, db)
        share.source_catalog_id = body.catalog_id
        notif_title = "שיתוף קורס קטלוג ממתין"

    db.add(share)
    await db.flush()
    await _notify_share_received(db, recipient.id, share.id, notif_title)
    return share


def _recipient_owns(catalog: CourseCatalog, recipient: User) -> bool:
    if recipient.role == UserRole.STUDENT:
        return catalog.owner_student_id == recipient.id
    return teacher_owns_catalog(catalog, recipient)


async def _existing_target(recipient: User, catalog_id: int, db: AsyncSession) -> CourseCatalog:
    catalog = await db.get(CourseCatalog, catalog_id)
    if not catalog or not _recipient_owns(catalog, recipient):
        raise HTTPException(status_code=404, detail="קורס קטלוג לא נמצא")
    return catalog


async def _create_target(
    recipient: User, body: TeacherShareAccept, source_name: str, db: AsyncSession
) -> CourseCatalog:
    name = (body.new_catalog_name or source_name).strip()
    if not name:
        raise HTTPException(status_code=400, detail="יש לבחור קורס קטלוג או ליצור חדש")
    if recipient.role == UserRole.STUDENT:
        offering = await create_personal_subject(db, recipient, name, body.new_catalog_description)
        catalog = await db.get(CourseCatalog, offering.catalog_course_id)
        if not catalog:
            raise HTTPException(status_code=404, detail="קורס קטלוג לא נמצא")
        return catalog
    catalog = CourseCatalog(name=name, description=body.new_catalog_description, teacher_id=recipient.id)
    db.add(catalog)
    await db.flush()
    return catalog


async def _resolve_target_catalog(
    recipient: User, body: TeacherShareAccept, source_name: str, db: AsyncSession
) -> CourseCatalog:
    if not body.target_catalog_id and not (body.new_catalog_name or "").strip():
        raise HTTPException(status_code=400, detail="יש לבחור קורס קטלוג או ליצור חדש")
    if body.target_catalog_id:
        return await _existing_target(recipient, body.target_catalog_id, db)
    return await _create_target(recipient, body, source_name, db)


async def _store_shared_exam(
    source: Exam, target: CourseCatalog, recipient: User, title: str, db: AsyncSession
) -> Exam:
    copy = await duplicate_exam_to_catalog(
        source,
        target_catalog_course_id=target.id,
        owner_teacher_id=recipient.id,
        title=title,
        db=db,
        bind_teacher_scope=recipient.role == UserRole.TEACHER,
    )
    if target.owner_student_id is not None and not is_tirgoul(copy):
        apply_exam_kind(copy, True)
        await open_tirgoul_sessions_if_ready(copy, db)
    return copy


async def _copy_exam_into_catalog(
    share: TeacherContentShare, target: CourseCatalog, recipient: User, db: AsyncSession
) -> Exam:
    exam = await _load_sender_exam(share.source_exam_id, share.sender_id, db)
    return await _store_shared_exam(exam, target, recipient, f"{exam.title} (משותף)", db)


async def _copy_catalog_exams(
    share: TeacherContentShare, target: CourseCatalog, recipient: User, db: AsyncSession
) -> int:
    result = await db.execute(
        select(Exam).where(
            Exam.catalog_course_id == share.source_catalog_id,
            Exam.private_student_id.is_(None),
        )
    )
    exams = list(result.scalars().all())
    for exam in exams:
        await _store_shared_exam(exam, target, recipient, exam.title, db)
    return len(exams)


async def accept_teacher_share(
    share_id: int, body: TeacherShareAccept, recipient: User, db: AsyncSession
) -> TeacherContentShare:
    share = await db.get(TeacherContentShare, share_id)
    if not share or share.recipient_id != recipient.id:
        raise HTTPException(status_code=404, detail="בקשת שיתוף לא נמצאה")
    if share.status != TeacherShareStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="הבקשה כבר טופלה")

    default_name = await _default_target_catalog_name(share, db)
    target = await _resolve_target_catalog(recipient, body, default_name, db)

    if share.share_type == TeacherShareType.EXAM.value:
        await _copy_exam_into_catalog(share, target, recipient, db)
    else:
        await _copy_catalog_exams(share, target, recipient, db)

    share.status = TeacherShareStatus.ACCEPTED.value
    share.target_catalog_id = target.id
    share.resolved_at = datetime.now(timezone.utc)
    return share


async def decline_teacher_share(share_id: int, recipient: User, db: AsyncSession) -> TeacherContentShare:
    share = await db.get(TeacherContentShare, share_id)
    if not share or share.recipient_id != recipient.id:
        raise HTTPException(status_code=404, detail="בקשת שיתוף לא נמצאה")
    if share.status != TeacherShareStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="הבקשה כבר טופלה")
    share.status = TeacherShareStatus.DECLINED.value
    share.resolved_at = datetime.now(timezone.utc)
    return share


async def _default_target_catalog_name(share: TeacherContentShare, db: AsyncSession) -> str:
    if share.source_catalog_id:
        catalog = await db.get(CourseCatalog, share.source_catalog_id)
        return catalog.name if catalog else "קורס משותף"
    if share.source_exam_id:
        exam = await db.get(Exam, share.source_exam_id)
        if exam:
            catalog = await db.get(CourseCatalog, exam.catalog_course_id)
            if catalog:
                return catalog.name
    return "קורס משותף"


async def _suggest_catalog_id(recipient: User, source_name: str | None, db: AsyncSession) -> int | None:
    if not source_name:
        return None
    owner = (
        CourseCatalog.owner_student_id == recipient.id
        if recipient.role == UserRole.STUDENT
        else CourseCatalog.teacher_id == recipient.id
    )
    result = await db.execute(
        select(CourseCatalog.id).where(owner, CourseCatalog.name == source_name)
    )
    return result.scalar_one_or_none()


async def share_to_response(share: TeacherContentShare, db: AsyncSession, viewer_id: int) -> TeacherShareResponse:
    sender = await db.get(User, share.sender_id)
    recipient = await db.get(User, share.recipient_id)
    exam_title = None
    catalog_name = None
    exam_count = None
    if share.source_exam_id:
        exam = await db.get(Exam, share.source_exam_id)
        exam_title = exam.title if exam else None
    if share.source_catalog_id:
        catalog = await db.get(CourseCatalog, share.source_catalog_id)
        catalog_name = catalog.name if catalog else None
        exam_count = await db.scalar(
            select(func.count()).select_from(Exam).where(
                Exam.catalog_course_id == share.source_catalog_id,
                Exam.private_student_id.is_(None),
            )
        )
    target_name = None
    if share.target_catalog_id:
        target = await db.get(CourseCatalog, share.target_catalog_id)
        target_name = target.name if target else None
    suggest_name = catalog_name
    if not suggest_name and share.source_exam_id:
        exam = await db.get(Exam, share.source_exam_id)
        if exam:
            cat = await db.get(CourseCatalog, exam.catalog_course_id)
            suggest_name = cat.name if cat else None
    suggested = None
    if recipient and share.recipient_id == viewer_id and share.status == TeacherShareStatus.PENDING.value:
        suggested = await _suggest_catalog_id(recipient, suggest_name, db)

    return TeacherShareResponse(
        id=share.id,
        share_type=TeacherShareType(share.share_type),
        status=TeacherShareStatus(share.status),
        sender_id=share.sender_id,
        sender_name=sender.full_name if sender else "",
        recipient_id=share.recipient_id,
        recipient_name=recipient.full_name if recipient else "",
        source_exam_id=share.source_exam_id,
        source_exam_title=exam_title,
        source_catalog_id=share.source_catalog_id,
        source_catalog_name=catalog_name,
        source_exam_count=exam_count,
        target_catalog_id=share.target_catalog_id,
        target_catalog_name=target_name,
        message=share.message,
        created_at=share.created_at,
        resolved_at=share.resolved_at,
        suggested_catalog_id=suggested,
    )
