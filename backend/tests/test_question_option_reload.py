"""Après édition, la même session doit renvoyer les nouvelles réponses (pas le cache)."""

from app.models.course import CourseCatalog
from app.models.enums import QuestionType, UserRole
from app.models.exam import Exam, Question, QuestionOption
from app.models.user import User
from app.schemas.exam import QuestionOptionCreate, QuestionUpdate
from app.services.exam_questions import load_question_with_options, update_question
from tests.integration.conftest import open_sqlite_maker


async def _seed_question(db) -> tuple[int, int]:
    user = User(email="t@x.com", password_hash="x", full_name="T", role=UserRole.TEACHER)
    db.add(user)
    await db.flush()
    catalog = CourseCatalog(name="C", teacher_id=user.id)
    db.add(catalog)
    await db.flush()
    exam = Exam(
        catalog_course_id=catalog.id,
        created_by_id=user.id,
        title="E",
        shuffle_questions=False,
        shuffle_options=False,
    )
    db.add(exam)
    await db.flush()
    question = Question(exam_id=exam.id, text="Q", question_type=QuestionType.SINGLE, order_index=0)
    db.add(question)
    await db.flush()
    db.add(QuestionOption(question_id=question.id, text="ישנה", is_correct=True, order_index=0))
    db.add(QuestionOption(question_id=question.id, text="אחרת", is_correct=False, order_index=1))
    await db.commit()
    return exam.id, question.id


async def test_saved_answer_is_visible_in_the_same_session():
    engine, maker = await open_sqlite_maker()
    async with maker() as db:
        exam_id, question_id = await _seed_question(db)
        body = QuestionUpdate(
            text="Q",
            question_type=QuestionType.SINGLE,
            options=[
                QuestionOptionCreate(text="ישנה", is_correct=False),
                QuestionOptionCreate(text="חדשה", is_correct=True),
            ],
        )
        await update_question(exam_id, question_id, body, db)
        await db.commit()
        loaded = await load_question_with_options(db, question_id)
        assert [(o.text, o.is_correct) for o in loaded.options] == [("ישנה", False), ("חדשה", True)]
    await engine.dispose()
