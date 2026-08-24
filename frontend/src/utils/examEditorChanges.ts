import { api, type ExamDetail, type Question } from "../api/client";

function questionPayload(q: Question) {
  return {
    text: q.text,
    image_url: q.image_url ?? null,
    question_type: q.question_type,
    points: q.points,
    options: q.options.map((o, i) => ({
      text: o.text,
      image_url: o.image_url ?? null,
      is_correct: o.is_correct ?? false,
      order_index: o.order_index ?? i,
    })),
    model_answer: q.model_answer ?? null,
    model_answer_source: q.model_answer_source ?? null,
  };
}

function normalizeQuestions(questions: Question[]) {
  return [...questions]
    .sort((a, b) => a.order_index - b.order_index || a.id - b.id)
    .map((q) => ({
      id: q.id,
      text: q.text,
      image_url: q.image_url ?? null,
      question_type: q.question_type,
      points: q.points,
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

function questionMatchKey(q: Question): string {
  return `${q.question_type}::${q.text}::${q.image_url ?? ""}::${q.model_answer ?? ""}`;
}

async function deleteAddedQuestions(
  examId: number,
  baseline: Question[],
  current: Question[],
): Promise<void> {
  const baselineIds = new Set(baseline.map((q) => q.id));
  for (const q of current) {
    if (!baselineIds.has(q.id)) {
      await api(`/api/exams/${examId}/questions/${q.id}`, { method: "DELETE" });
    }
  }
}

async function restoreMissingQuestions(
  examId: number,
  baseline: Question[],
  current: Question[],
): Promise<void> {
  const currentIds = new Set(current.map((q) => q.id));
  for (const q of baseline) {
    if (currentIds.has(q.id)) continue;
    await api<Question>(`/api/exams/${examId}/questions`, {
      method: "POST",
      body: JSON.stringify({ ...questionPayload(q), order_index: q.order_index }),
    });
  }
}

async function patchChangedQuestions(
  examId: number,
  baseline: Question[],
  current: Question[],
): Promise<void> {
  const currentById = new Map(current.map((q) => [q.id, q]));
  for (const bq of baseline) {
    const cq = currentById.get(bq.id);
    if (!cq) continue;
    if (questionsFingerprint([bq]) === questionsFingerprint([cq])) continue;
    await api(`/api/exams/${examId}/questions/${bq.id}`, {
      method: "PATCH",
      body: JSON.stringify(questionPayload(bq)),
    });
  }
}

async function reorderToBaseline(examId: number, baseline: Question[]): Promise<void> {
  const exam = await api<ExamDetail>(`/api/exams/${examId}`);
  const byId = new Map(exam.questions.map((q) => [q.id, q]));
  const byKey = new Map(exam.questions.map((q) => [questionMatchKey(q), q]));
  const orderedIds: number[] = [];
  for (const bq of [...baseline].sort((a, b) => a.order_index - b.order_index)) {
    const match = byId.get(bq.id) ?? byKey.get(questionMatchKey(bq));
    if (match) orderedIds.push(match.id);
  }
  for (const q of exam.questions) {
    if (!orderedIds.includes(q.id)) orderedIds.push(q.id);
  }
  if (orderedIds.length === 0) return;
  await api(`/api/exams/${examId}/questions/reorder`, {
    method: "PUT",
    body: JSON.stringify({ question_ids: orderedIds }),
  });
}

export async function revertExamQuestionsToBaseline(
  examId: number,
  baseline: Question[],
  current: Question[],
): Promise<void> {
  await deleteAddedQuestions(examId, baseline, current);
  await restoreMissingQuestions(examId, baseline, current);
  await patchChangedQuestions(examId, baseline, current);
  await reorderToBaseline(examId, baseline);
}
