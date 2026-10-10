import type { ExamTake, StudentQuestion } from "../api/client";

export type SavedAnswers = ExamTake["saved_answers"];

export function answersFromSaved(saved: SavedAnswers): Record<number, number[]> {
  const out: Record<number, number[]> = {};
  for (const row of saved ?? []) out[row.question_id] = row.selected_option_ids;
  return out;
}

export function textsFromSaved(saved: SavedAnswers): Record<number, string> {
  const out: Record<number, string> = {};
  for (const row of saved ?? []) {
    if (row.text_answer) out[row.question_id] = row.text_answer;
  }
  return out;
}

/** Corps de requête commun à l'enregistrement du brouillon et à la remise. */
export function buildAnswersPayload(
  questions: StudentQuestion[],
  answers: Record<number, number[]>,
  textAnswers: Record<number, string>,
) {
  return {
    answers: questions.map((q) => ({
      question_id: q.id,
      selected_option_ids: answers[q.id] ?? [],
      text_answer: q.question_type === "open" ? (textAnswers[q.id] ?? "") : null,
    })),
  };
}

/** Millisecondes restantes avant l'échéance ; null si pas de limite de temps. */
export function msUntil(expiresAt: string | null, now: number = Date.now()): number | null {
  if (!expiresAt) return null;
  return new Date(expiresAt).getTime() - now;
}

/** « MM:SS » (ou « — » sans limite, « 00:00 » une fois écoulé). */
export function formatRemaining(expiresAt: string | null, now: number = Date.now()): string {
  const ms = msUntil(expiresAt, now);
  if (ms === null) return "—";
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export type TimerLevel = "normal" | "warning" | "critical";

const CRITICAL_MS = 60_000;

/** Urgence du minuteur : critique sous 1 min, avertissement sous le seuil réglé par le professeur. */
export function timerLevel(msLeft: number | null, warningMinutes: number): TimerLevel {
  if (msLeft === null) return "normal";
  if (msLeft <= CRITICAL_MS) return "critical";
  return msLeft <= warningMinutes * 60_000 ? "warning" : "normal";
}

/** Nombre de questions sans réponse. */
export function unansweredCount(total: number, answered: number): number {
  return Math.max(0, total - answered);
}
