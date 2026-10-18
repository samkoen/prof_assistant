"""Sous-tâches d'une משימה."""

from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exam import Exam
from app.models.task import TaskProof, TaskReview, TaskStep
from app.schemas.task import TaskStepBody
from app.services.exam_kind import is_task
from app.services.task_rules import step_text_error


def _require_task(exam: Exam) -> None:
    if not is_task(exam):
        raise HTTPException(status_code=400, detail="זו אינה משימה")


async def step_counts_by_exam_id(exam_ids: list[int], db: AsyncSession) -> dict[int, int]:
    if not exam_ids:
        return {}
    rows = await db.execute(
        select(TaskStep.exam_id, func.count())
        .where(TaskStep.exam_id.in_(exam_ids))
        .group_by(TaskStep.exam_id)
    )
    return {exam_id: int(count) for exam_id, count in rows.all()}


async def list_steps(exam_id: int, db: AsyncSession) -> list[TaskStep]:
    rows = await db.execute(
        select(TaskStep).where(TaskStep.exam_id == exam_id).order_by(TaskStep.order_index, TaskStep.id)
    )
    return list(rows.scalars().all())


async def _next_order(exam_id: int, db: AsyncSession) -> int:
    current = await db.scalar(select(func.max(TaskStep.order_index)).where(TaskStep.exam_id == exam_id))
    return (current if current is not None else -1) + 1


def _step_text(body: TaskStepBody) -> tuple[str, str]:
    message = step_text_error(body.title, body.instructions)
    if message:
        raise HTTPException(status_code=400, detail=message)
    return body.title.strip(), body.instructions.strip()


async def add_step(exam: Exam, body: TaskStepBody, db: AsyncSession) -> TaskStep:
    _require_task(exam)
    title, instructions = _step_text(body)
    step = TaskStep(
        exam_id=exam.id,
        order_index=await _next_order(exam.id, db),
        title=title,
        instructions=instructions,
        max_points=body.max_points,
    )
    db.add(step)
    await db.flush()
    from app.services.exam_lifecycle import open_task_sessions_if_ready

    await open_task_sessions_if_ready(exam, db)
    return step


async def _step_of(exam_id: int, step_id: int, db: AsyncSession) -> TaskStep:
    step = await db.get(TaskStep, step_id)
    if not step or step.exam_id != exam_id:
        raise HTTPException(status_code=404, detail="תת-משימה לא נמצאה")
    return step


async def update_step(exam: Exam, step_id: int, body: TaskStepBody, db: AsyncSession) -> TaskStep:
    _require_task(exam)
    step = await _step_of(exam.id, step_id, db)
    step.title, step.instructions = _step_text(body)
    step.max_points = body.max_points
    await db.flush()
    return step


async def delete_step(exam: Exam, step_id: int, db: AsyncSession) -> None:
    _require_task(exam)
    step = await _step_of(exam.id, step_id, db)
    await _delete_step_rows(step.id, db)
    await db.delete(step)


async def _delete_step_rows(step_id: int, db: AsyncSession) -> None:
    for model in (TaskProof, TaskReview):
        rows = await db.execute(select(model).where(model.step_id == step_id))
        for row in rows.scalars():
            await db.delete(row)


async def copy_task_steps(source_id: int, copy_id: int, db: AsyncSession) -> None:
    for step in await list_steps(source_id, db):
        db.add(
            TaskStep(
                exam_id=copy_id,
                order_index=step.order_index,
                title=step.title,
                instructions=step.instructions,
                max_points=step.max_points,
            )
        )

