import type { Question } from "../api/client";

export type AnswerKeyDraft = Record<number, number[]>;

export function qcmQuestions(questions: Question[]): Question[] {
  return questions.filter((q) => q.question_type !== "open");
}

export function draftFromQuestions(questions: Question[]): AnswerKeyDraft {
  const draft: AnswerKeyDraft = {};
  for (const q of qcmQuestions(questions)) {
    draft[q.id] = q.options.filter((o) => o.is_correct).map((o) => o.id);
  }
  return draft;
}

export function toggleAnswerKeyOption(
  draft: AnswerKeyDraft,
  question: Question,
  optionId: number,
): AnswerKeyDraft {
  if (question.question_type === "multiple") {
    const current = new Set(draft[question.id] ?? []);
    if (current.has(optionId)) current.delete(optionId);
    else current.add(optionId);
    return { ...draft, [question.id]: [...current] };
  }
  return { ...draft, [question.id]: [optionId] };
}

export function isQcmKeyValid(question: Question, ids: number[]): boolean {
  if (ids.length === 0) return false;
  if (question.question_type === "multiple") return true;
  return ids.length === 1;
}

function sortedIds(ids: number[]): string {
  return [...ids].sort((a, b) => a - b).join(",");
}

export function answerKeyChanged(questions: Question[], draft: AnswerKeyDraft): boolean {
  const initial = draftFromQuestions(questions);
  return qcmQuestions(questions).some(
    (q) => sortedIds(initial[q.id] ?? []) !== sortedIds(draft[q.id] ?? []),
  );
}

export function isAnswerKeyDraftValid(questions: Question[], draft: AnswerKeyDraft): boolean {
  return qcmQuestions(questions).every((q) => isQcmKeyValid(q, draft[q.id] ?? []));
}

export function toAnswerKeyPayload(draft: AnswerKeyDraft) {
  return {
    questions: Object.entries(draft).map(([questionId, correct_option_ids]) => ({
      question_id: Number(questionId),
      correct_option_ids,
    })),
  };
}
