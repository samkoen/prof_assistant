from dataclasses import dataclass

from sqlalchemy.ext.asyncio import async_sessionmaker

from app.models.enums import UserRole
from app.models.user import User
from app.security import hash_password

PASSWORD = "test-pass-1"
ADMIN_EMAIL = "admin.it@example.com"
TEACHER_EMAIL = "teacher.it@example.com"
STUDENT_EMAIL = "student.it@example.com"
CLASSMATE_EMAIL = "classmate.it@example.com"

_HASH: str | None = None


def test_password_hash() -> str:
    global _HASH
    if _HASH is None:
        _HASH = hash_password(PASSWORD)
    return _HASH


def _user(email: str, role: UserRole, full_name: str) -> User:
    return User(
        email=email,
        password_hash=test_password_hash(),
        full_name=full_name,
        role=role,
        email_verified=True,
    )


@dataclass
class SeededUsers:
    admin_id: int
    teacher_id: int
    student_id: int
    classmate_id: int


async def seed_core_users(maker: async_sessionmaker) -> SeededUsers:
    async with maker() as db:
        admin = _user(ADMIN_EMAIL, UserRole.ADMIN, "Admin IT")
        teacher = _user(TEACHER_EMAIL, UserRole.TEACHER, "Teacher IT")
        student = _user(STUDENT_EMAIL, UserRole.STUDENT, "Student IT")
        classmate = _user(CLASSMATE_EMAIL, UserRole.STUDENT, "Classmate IT")
        db.add_all([admin, teacher, student, classmate])
        await db.commit()
        await db.refresh(admin)
        await db.refresh(teacher)
        await db.refresh(student)
        await db.refresh(classmate)
        return SeededUsers(
            admin_id=admin.id,
            teacher_id=teacher.id,
            student_id=student.id,
            classmate_id=classmate.id,
        )
