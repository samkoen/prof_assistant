"""Règles pures d'une משימה : fichier, note, totaux. Aucun appel IA."""

from __future__ import annotations

from dataclasses import dataclass

from app.models.enums import TaskReviewSource, TaskVerdict

ALLOWED_PROOF_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".txt", ".docx"}
_VERDICTS = {TaskVerdict.DONE.value, TaskVerdict.PARTIAL.value, TaskVerdict.NOT_DONE.value}


@dataclass(frozen=True)
class StepPoints:
    step_id: int
    max_points: float


def step_text_error(title: str, instructions: str) -> str | None:
    """Message hébreu si le titre ou la description manque."""
    if not instructions.strip():
        return "התיאור הוא שדה חובה"
    if not title.strip():
        return "הכותרת היא שדה חובה"
    return None


def proof_suffix(filename: str) -> str:
    dot = filename.rfind(".")
    if dot < 0:
        return ""
    return filename[dot:].lower()


def proof_rejection(filename: str, size: int, max_bytes: int) -> str | None:
    """Message hébreu si le fichier est refusé, sinon None."""
    if size <= 0:
        return "הקובץ ריק"
    if size > max_bytes:
        return "הקובץ גדול מדי"
    if proof_suffix(filename) not in ALLOWED_PROOF_SUFFIXES:
        return "סוג קובץ לא נתמך"
    return None


def clamp_task_score(score: float, max_points: float) -> float:
    ceiling = max(0.0, float(max_points))
    try:
        value = float(score)
    except (TypeError, ValueError):
        value = 0.0
    return round(min(ceiling, max(0.0, value)), 2)


def attempt_totals(steps: list[StepPoints], scores: dict[int, float]) -> tuple[float, float]:
    """Somme des notes retenues et plafond. Une sous-tâche sans avis vaut 0."""
    earned = round(sum(scores.get(step.step_id, 0.0) for step in steps), 2)
    maximum = round(sum(max(0.0, step.max_points) for step in steps), 2)
    return earned, maximum


def auto_not_done() -> tuple[str, float, str]:
    return TaskVerdict.NOT_DONE.value, 0.0, TaskReviewSource.AUTO.value


def is_known_verdict(value: str) -> bool:
    return value in _VERDICTS
