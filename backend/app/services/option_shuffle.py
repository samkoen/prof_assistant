"""Mélange des options de réponse (QCM) en préservant le sens des options « spéciales »."""

from __future__ import annotations

import random
import re
from typing import Callable, Sequence, TypeVar

from app.models.enums import QuestionType
from app.schemas.exam import QuestionCreate

T = TypeVar("T")

# « Toutes les réponses ci-dessus », « aucune des réponses » : doivent rester en dernier.
_PINNED_LAST = re.compile(
    r"כל\s+התשובות|כל\s+האמור|כל\s+הנ[\"״]?ל|כולן|כולם|אף\s+(?:אחת|תשובה)|אין\s+תשובה|"
    r"none\s+of\s+the|all\s+of\s+the\s+above|both\s+of\s+the|aucune\s+des|toutes\s+les|"
    r"все\s+вышеперечисленн|ни\s+один",
    re.IGNORECASE,
)

# « A ו-B », « A+C », « B, C » : une option qui cite d'autres options par leur lettre.
_LATIN_REFERENCE = (
    r"(?<![A-Za-z])[A-Da-d](?![A-Za-z])\s*(?:\+|,|&|and\b|or\b|ו-?|או)\s*[A-Da-d](?![A-Za-z])"
)
# Lettres hébraïques d'option (א-ד) : « א ו-ב », « א+ג », « ב, ד ».
_HEBREW_REFERENCE = (
    r"(?<![\u0590-\u05FF])[אבגד](?![\u0590-\u05FF])\s*(?:\+|,|&|ו-?|או)\s*[אבגד](?![\u0590-\u05FF])"
)
_LETTER_REFERENCE = re.compile(f"{_LATIN_REFERENCE}|{_HEBREW_REFERENCE}")


def is_pinned_last(text: str) -> bool:
    return bool(_PINNED_LAST.search(text or ""))


def references_letters(text: str) -> bool:
    return bool(_LETTER_REFERENCE.search(text or ""))


def shuffled_options(
    options: Sequence[T], rng: random.Random, text_of: Callable[[T], str]
) -> list[T]:
    """Options mélangées ; « toutes les réponses… » en dernier ; ordre intact si lettres citées."""
    items = list(options)
    if any(references_letters(text_of(o)) for o in items):
        return items
    pinned = [o for o in items if is_pinned_last(text_of(o))]
    free = [o for o in items if not is_pinned_last(text_of(o))]
    rng.shuffle(free)
    return free + pinned


def _is_shufflable(question: QuestionCreate) -> bool:
    qcm = (QuestionType.SINGLE, QuestionType.MULTIPLE)
    return question.question_type in qcm and len(question.options) > 1


def shuffle_question_options(question: QuestionCreate, rng: random.Random | None = None) -> None:
    """Mélange en place les options d'une question QCM issue de l'IA et renumérote `order_index`."""
    if not _is_shufflable(question):
        return
    ordered = shuffled_options(question.options, rng or random.Random(), lambda o: o.text)
    for index, option in enumerate(ordered):
        option.order_index = index
    question.options = ordered


def shuffle_generated_questions(
    questions: Sequence[QuestionCreate], rng: random.Random | None = None
) -> None:
    rng = rng or random.Random()
    for question in questions:
        shuffle_question_options(question, rng)
