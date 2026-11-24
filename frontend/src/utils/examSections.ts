import type { ExamSection } from "../api/client";
import { isQuestionAnswered } from "./studentExamQuestionNav";

type SectionedQuestion = { id: number; section_id?: number | null; points: number; question_type: "single" | "multiple" | "open" };

export type QuestionGroup<Q> = {
  section: ExamSection | null;
  /** Question + numéro affiché (1…n sur tout le sujet). */
  items: { question: Q; index: number }[];
};

function sortedSections(sections: ExamSection[]): ExamSection[] {
  return [...sections].sort((a, b) => a.order_index - b.order_index || a.id - b.id);
}

/** Questions hors partie d'abord, puis une liste par partie ; la numérotation suit cet ordre. */
export function groupQuestionsBySection<Q extends { section_id?: number | null }>(
  questions: Q[],
  sections: ExamSection[] = [],
): QuestionGroup<Q>[] {
  const ordered = sortedSections(sections);
  const known = new Set(ordered.map((s) => s.id));
  const buckets: { section: ExamSection | null; questions: Q[] }[] = [
    { section: null, questions: questions.filter((q) => q.section_id == null || !known.has(q.section_id)) },
    ...ordered.map((section) => ({ section, questions: questions.filter((q) => q.section_id === section.id) })),
  ];
  let index = 0;
  return buckets
    .filter((bucket) => bucket.questions.length > 0)
    .map((bucket) => ({
      section: bucket.section,
      items: bucket.questions.map((question) => ({ question, index: (index += 1) })),
    }));
}

/** N quand la partie impose un choix (N < nombre de questions), sinon null. */
export function effectiveRequired(section: ExamSection | null, questionCount: number): number | null {
  const required = section?.required_count ?? null;
  if (!required || required >= questionCount) return null;
  return required;
}

/** Points que rapporte une partie : les N questions les mieux dotées quand il y a un choix. */
export function groupMaxPoints(group: QuestionGroup<SectionedQuestion>): number {
  const points = group.items.map((item) => item.question.points).sort((a, b) => b - a);
  const required = effectiveRequired(group.section, points.length);
  return (required == null ? points : points.slice(0, required)).reduce((sum, p) => sum + p, 0);
}

export function examMaxPoints(questions: SectionedQuestion[], sections: ExamSection[] = [], scoreCap?: number | null): number {
  const total = groupQuestionsBySection(questions, sections).reduce((sum, group) => sum + groupMaxPoints(group), 0);
  return scoreCap != null ? Math.min(total, scoreCap) : total;
}

type AnswerMaps = { answers: Record<number, number[]>; textAnswers: Record<number, string> };

function answeredInGroup(group: QuestionGroup<SectionedQuestion>, maps: AnswerMaps): number {
  return group.items.filter((item) => isQuestionAnswered(item.question, maps.answers, maps.textAnswers)).length;
}

/** Questions encore vides d'une partie dont le quota de réponses est atteint : à verrouiller. */
export function lockedQuestionIds(questions: SectionedQuestion[], sections: ExamSection[], maps: AnswerMaps): Set<number> {
  const locked = new Set<number>();
  for (const group of groupQuestionsBySection(questions, sections)) {
    const required = effectiveRequired(group.section, group.items.length);
    if (required == null || answeredInGroup(group, maps) < required) continue;
    for (const { question } of group.items) {
      if (!isQuestionAnswered(question, maps.answers, maps.textAnswers)) locked.add(question.id);
    }
  }
  return locked;
}

/** Nombre de réponses attendues sur tout le sujet, et combien sont déjà données (plafonné par partie). */
export function answerProgress(questions: SectionedQuestion[], sections: ExamSection[], maps: AnswerMaps): { required: number; answered: number } {
  let required = 0;
  let answered = 0;
  for (const group of groupQuestionsBySection(questions, sections)) {
    const quota = effectiveRequired(group.section, group.items.length) ?? group.items.length;
    required += quota;
    answered += Math.min(quota, answeredInGroup(group, maps));
  }
  return { required, answered };
}

/** Nombre de réponses données dans une partie (pour « נענו 3 מתוך 6 »). */
export function groupAnsweredCount(group: QuestionGroup<SectionedQuestion>, maps: AnswerMaps): number {
  return answeredInGroup(group, maps);
}

/** Prochaine question sans réponse à laquelle l'élève peut encore répondre (hors questions verrouillées). */
export function findNextAnswerableIndex(
  questions: SectionedQuestion[],
  sections: ExamSection[],
  maps: AnswerMaps,
  afterIndex: number,
): number | null {
  const locked = lockedQuestionIds(questions, sections, maps);
  const open = (i: number) => !locked.has(questions[i].id) && !isQuestionAnswered(questions[i], maps.answers, maps.textAnswers);
  for (let step = 1; step <= questions.length; step += 1) {
    const i = (afterIndex + step) % questions.length;
    if (open(i)) return i;
  }
  return null;
}

/** Plafond saisi par le professeur : vide ou invalide = pas de plafond. */
export function parseScoreCap(raw: string): number | null {
  const value = Number(raw.trim().replace(",", "."));
  return raw.trim() !== "" && Number.isFinite(value) && value > 0 ? value : null;
}

/** Nombre de questions à traiter saisi par le professeur : vide = toutes. */
export function parseRequiredCount(raw: string): number | null {
  const value = Number(raw.trim());
  return Number.isInteger(value) && value >= 1 ? value : null;
}

/**
 * Statut, à la correction, d'une question hors barème dans une partie « N sur M » :
 * "skipped" si l'élève l'a laissée de côté (son droit), "extra" s'il y a répondu en trop.
 */
export function uncountedReviewKind(q: {
  counted?: boolean;
  student_options?: unknown[];
  student_text_answer?: string | null;
}): "skipped" | "extra" | null {
  if (q.counted !== false) return null;
  const answered = (q.student_options?.length ?? 0) > 0 || Boolean(q.student_text_answer?.trim());
  return answered ? "extra" : "skipped";
}

/**
 * Nouvel ordre global des questions après déplacement d'une question à l'intérieur de sa partie ;
 * null si elle est déjà en bord de partie.
 */
export function moveWithinGroup<Q extends { id: number; section_id?: number | null }>(
  questions: Q[],
  sections: ExamSection[],
  questionId: number,
  direction: -1 | 1,
): number[] | null {
  const group = groupQuestionsBySection(questions, sections).find((g) => g.items.some((item) => item.question.id === questionId));
  if (!group) return null;
  const position = group.items.findIndex((item) => item.question.id === questionId);
  const neighbor = group.items[position + direction];
  if (!neighbor) return null;
  const ids = questions.map((q) => q.id);
  const from = ids.indexOf(questionId);
  const to = ids.indexOf(neighbor.question.id);
  [ids[from], ids[to]] = [ids[to], ids[from]];
  return ids;
}
