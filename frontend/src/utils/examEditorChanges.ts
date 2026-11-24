import type { Question } from "../api/client";

function normalizeQuestions(questions: Question[]) {
  return [...questions]
    .sort((a, b) => a.order_index - b.order_index || a.id - b.id)
    .map((q) => ({
      id: q.id,
      text: q.text,
      image_url: q.image_url ?? null,
      question_type: q.question_type,
      points: q.points,
      section_id: q.section_id ?? null,
      order_index: q.order_index,
      model_answer: q.model_answer ?? null,
      options: [...q.options]
        .sort((a, b) => a.order_index - b.order_index || a.id - b.id)
        .map((o) => ({
          id: o.id,
          text: o.text,
          image_url: o.image_url ?? null,
          is_correct: o.is_correct ?? false,
          order_index: o.order_index,
        })),
    }));
}

export function questionsFingerprint(questions: Question[]): string {
  return JSON.stringify(normalizeQuestions(questions));
}

export function mergeSavedQuestion(
  questions: Question[],
  saved: Question,
  created: boolean,
): Question[] {
  const next = created
    ? [...questions, saved]
    : questions.map((q) => (q.id === saved.id ? saved : q));
  return [...next].sort((a, b) => a.order_index - b.order_index || a.id - b.id);
}

export function removeQuestionFromList(questions: Question[], questionId: number): Question[] {
  return questions.filter((q) => q.id !== questionId);
}
