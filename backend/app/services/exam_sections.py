"""Parties d'un examen : CRUD, ordre du sujet et règles de notation."""

from __future__ import annotations

import random

from fastapi import HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exam import Exam, ExamSection, Question
from app.schemas.exam import ExamSectionBody
from app.services.scoring import ScoringRules


async def list_sections(exam_id: int, db: AsyncSession) -> list[ExamSection]:
    result = await db.execute(
        select(ExamSection)
        .where(ExamSection.exam_id == exam_id)
        .order_by(ExamSection.order_index, ExamSection.id)
    )
    return list(result.scalars().all())


async def _get_section(exam_id: int, section_id: int, db: AsyncSession) -> ExamSection:
    section = await db.get(ExamSection, section_id)
    if not section or section.exam_id != exam_id:
        raise HTTPException(status_code=404, detail="חלק לא נמצא")
    return section


def _clean_instructions(text: str | None) -> str | None:
    return (text or "").strip() or None


def _apply_body(section: ExamSection, body: ExamSectionBody) -> None:
    section.title = body.title.strip()
    section.instructions = _clean_instructions(body.instructions)
    section.required_count = body.required_count


async def add_section(exam_id: int, body: ExamSectionBody, db: AsyncSession) -> ExamSection:
    last = await db.scalar(
        select(func.max(ExamSection.order_index)).where(ExamSection.exam_id == exam_id)
    )
    section = ExamSection(exam_id=exam_id, order_index=(last if last is not None else -1) + 1)
    _apply_body(section, body)
    db.add(section)
    await db.flush()
    return section


async def update_section(
    exam_id: int, section_id: int, body: ExamSectionBody, db: AsyncSession
) -> ExamSection:
    section = await _get_section(exam_id, section_id, db)
    _apply_body(section, body)
    await db.flush()
    return section


async def delete_section(exam_id: int, section_id: int, db: AsyncSession) -> None:
    """Supprime la partie ; ses questions restent dans l'examen, hors partie."""
    section = await _get_section(exam_id, section_id, db)
    await db.execute(
        update(Question).where(Question.section_id == section.id).values(section_id=None)
    )
    await db.delete(section)


async def delete_exam_sections(exam_id: int, db: AsyncSession) -> None:
    for section in await list_sections(exam_id, db):
        await db.delete(section)


async def reorder_sections(exam_id: int, section_ids: list[int], db: AsyncSession) -> None:
    sections = {s.id: s for s in await list_sections(exam_id, db)}
    if set(section_ids) != set(sections) or len(section_ids) != len(sections):
        raise HTTPException(status_code=400, detail="רשימת החלקים אינה תואמת")
    for index, section_id in enumerate(section_ids):
        sections[section_id].order_index = index


async def resolve_section_id(exam_id: int, section_id: int | None, db: AsyncSession) -> int | None:
    """Valide qu'une partie appartient bien à l'examen avant d'y rattacher une question."""
    if section_id is None:
        return None
    await _get_section(exam_id, section_id, db)
    return section_id


async def assign_questions(
    exam_id: int, question_ids: list[int], section_id: int | None, db: AsyncSession
) -> None:
    target = await resolve_section_id(exam_id, section_id, db)
    result = await db.execute(
        select(Question).where(Question.exam_id == exam_id, Question.id.in_(question_ids))
    )
    questions = list(result.scalars().all())
    if len(questions) != len(set(question_ids)):
        raise HTTPException(status_code=404, detail="שאלה לא נמצאה")
    for question in questions:
        question.section_id = target


async def copy_sections(source_exam_id: int, target_exam_id: int, db: AsyncSession) -> dict[int, int]:
    """Duplique les parties ; retourne ancien id → nouvel id pour rattacher les questions copiées."""
    mapping: dict[int, int] = {}
    for section in await list_sections(source_exam_id, db):
        clone = ExamSection(
            exam_id=target_exam_id,
            title=section.title,
            instructions=section.instructions,
            order_index=section.order_index,
            required_count=section.required_count,
        )
        db.add(clone)
        await db.flush()
        mapping[section.id] = clone.id
    return mapping


def scoring_rules(exam: Exam, sections: list[ExamSection]) -> ScoringRules:
    required = {s.id: s.required_count for s in sections if s.required_count}
    return ScoringRules(required_by_section=required, score_cap=exam.score_cap)


async def load_scoring_rules(exam: Exam, db: AsyncSession) -> ScoringRules:
    return scoring_rules(exam, await list_sections(exam.id, db))


def group_questions_by_section(
    questions: list[Question], sections: list[ExamSection]
) -> list[list[Question]]:
    """Questions hors partie d'abord, puis une liste par partie dans l'ordre du professeur."""
    known = {s.id for s in sections}
    groups: list[list[Question]] = [[q for q in questions if q.section_id not in known]]
    groups.extend([q for q in questions if q.section_id == s.id] for s in sections)
    return [group for group in groups if group]


def paper_order(
    questions: list[Question],
    sections: list[ExamSection],
    rng: random.Random,
    *,
    shuffle: bool,
) -> list[Question]:
    """Ordre du sujet : le mélange reste à l'intérieur de chaque partie."""
    ordered: list[Question] = []
    for group in group_questions_by_section(questions, sections):
        if shuffle:
            rng.shuffle(group)
        ordered.extend(group)
    return ordered
