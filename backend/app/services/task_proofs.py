"""Dépôt et lecture des preuves élève."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import undefer

from app.config import settings
from app.models.exam import Exam, StudentExamAttempt
from app.models.task import TaskProof, TaskStep
from app.services.ai_attachments import mime_type_for_suffix
from app.services.task_rules import proof_rejection, proof_suffix
from app.services.task_service import _step_of


def _reject_if_submitted(attempt: StudentExamAttempt) -> None:
    if attempt.submitted_at:
        raise HTTPException(status_code=400, detail="כבר הוגש")


async def proofs_by_step(attempt_id: int, db: AsyncSession) -> dict[int, TaskProof]:
    rows = await db.execute(select(TaskProof).where(TaskProof.attempt_id == attempt_id))
    return {row.step_id: row for row in rows.scalars().all()}


async def save_proof(
    exam: Exam,
    attempt: StudentExamAttempt,
    step_id: int,
    filename: str,
    data: bytes,
    db: AsyncSession,
) -> TaskProof:
    _reject_if_submitted(attempt)
    step = await _step_of(exam.id, step_id, db)
    reason = proof_rejection(filename, len(data), settings.question_image_max_bytes)
    if reason:
        raise HTTPException(status_code=400, detail=reason)
    proof = await _upsert_proof(attempt.id, step.id, filename, data, db)
    await db.flush()
    return proof


async def _upsert_proof(attempt_id: int, step_id: int, filename: str, data: bytes, db: AsyncSession) -> TaskProof:
    existing = (
        await db.execute(select(TaskProof).where(TaskProof.attempt_id == attempt_id, TaskProof.step_id == step_id))
    ).scalar_one_or_none()
    proof = existing or TaskProof(attempt_id=attempt_id, step_id=step_id, filename=filename, mime_type="", file_data=data)
    proof.filename = filename
    proof.mime_type = mime_type_for_suffix(proof_suffix(filename))
    proof.file_data = data
    proof.size_bytes = len(data)
    proof.uploaded_at = datetime.now(timezone.utc)
    if existing is None:
        db.add(proof)
    return proof


async def load_proof_bytes(attempt_id: int, step_id: int, db: AsyncSession) -> TaskProof:
    row = (
        await db.execute(
            select(TaskProof)
            .options(undefer(TaskProof.file_data))
            .where(TaskProof.attempt_id == attempt_id, TaskProof.step_id == step_id)
        )
    ).scalar_one_or_none()
    if not row or not row.file_data:
        raise HTTPException(status_code=404, detail="אין קובץ")
    return row


def student_steps(steps: list[TaskStep], proofs: dict[int, TaskProof]) -> list[dict]:
    return [
        {
            "id": step.id,
            "order_index": step.order_index,
            "title": step.title,
            "instructions": step.instructions,
            "max_points": step.max_points,
            "proof_filename": proofs[step.id].filename if step.id in proofs else None,
            "proof_ready": step.id in proofs,
        }
        for step in steps
    ]
