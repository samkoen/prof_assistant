import type { ExamAttempt, ExamSession, StudentExamSessionWithAttempt } from "../api/client";
import { he } from "../i18n/he";
import type { StatusTone } from "../theme/brand";

export type StudentExamKey = "in_progress" | "todo" | "submitted" | "graded" | "missed";

export interface StudentExamView {
  key: StudentExamKey;
  label: string;
  tone: StatusTone;
  /** Libellé du bouton d'action de la carte. */
  actionLabel: string;
  /** L'élève peut ouvrir la page (démarrer, continuer ou voir le résultat). */
  openable: boolean;
  /** Examen à faire (démarrer ou continuer) : action principale mise en avant. */
  pending: boolean;
}

type SessionLike = Pick<ExamSession, "status" | "is_tirgoul" | "results_published">;
type AttemptLike = Pick<ExamAttempt, "started_at" | "submitted_at" | "score" | "max_score"> | null;

function isGraded(session: SessionLike, attempt: NonNullable<AttemptLike>): boolean {
  const published = Boolean(session.is_tirgoul || session.results_published);
  return published && attempt.score != null && attempt.max_score != null;
}

/** État d'un examen du point de vue de l'élève : libellé, couleur et action possible. */
export function studentExamView(session: SessionLike, attempt: AttemptLike): StudentExamView {
  if (attempt?.submitted_at) {
    const graded = isGraded(session, attempt);
    return {
      key: graded ? "graded" : "submitted",
      label: graded ? he.studentStateGraded : he.studentStateSubmitted,
      tone: graded ? "violet" : "info",
      actionLabel: he.viewExamResult,
      openable: true,
      pending: false,
    };
  }
  if (attempt?.started_at) {
    return { key: "in_progress", label: he.studentStateInProgress, tone: "warning", actionLabel: he.continueExam, openable: true, pending: true };
  }
  if (session.status === "active") {
    return { key: "todo", label: he.studentStateTodo, tone: "success", actionLabel: he.startExam, openable: true, pending: true };
  }
  return { key: "missed", label: he.examClosed, tone: "neutral", actionLabel: he.examClosed, openable: false, pending: false };
}

/** Pourcentage de réussite (0–100) ; null si le score n'est pas disponible. */
export function scorePercent(attempt: Pick<ExamAttempt, "score" | "max_score"> | null): number | null {
  if (!attempt || attempt.score == null || !attempt.max_score) return null;
  return Math.max(0, Math.min(100, Math.round((attempt.score / attempt.max_score) * 100)));
}

/** Couleur de la barre de score : vert dès 80 %, bleu dès 55 %, ambre en dessous. */
export function scoreTone(percent: number): StatusTone {
  if (percent >= 80) return "success";
  if (percent >= 55) return "info";
  return "warning";
}

const PRIORITY: Record<StudentExamKey, number> = { in_progress: 0, todo: 1, graded: 2, submitted: 3, missed: 4 };

function byPriorityThenRecent(a: StudentExamSessionWithAttempt, b: StudentExamSessionWithAttempt): number {
  const pa = PRIORITY[studentExamView(a, a.attempt).key];
  const pb = PRIORITY[studentExamView(b, b.attempt).key];
  return pa - pb || b.id - a.id;
}

/** À faire (en cours puis à démarrer) d'un côté ; terminés / manqués de l'autre. */
export function splitStudentSessions(sessions: StudentExamSessionWithAttempt[]) {
  const sorted = [...sessions].sort(byPriorityThenRecent);
  return {
    pending: sorted.filter((s) => studentExamView(s, s.attempt).pending),
    done: sorted.filter((s) => !studentExamView(s, s.attempt).pending),
  };
}

export interface StudentExamCounts {
  todo: number;
  inProgress: number;
  graded: number;
  submitted: number;
}

export function countStudentExams(sessions: StudentExamSessionWithAttempt[]): StudentExamCounts {
  const counts: StudentExamCounts = { todo: 0, inProgress: 0, graded: 0, submitted: 0 };
  for (const s of sessions) {
    const key = studentExamView(s, s.attempt).key;
    if (key === "todo") counts.todo += 1;
    else if (key === "in_progress") counts.inProgress += 1;
    else if (key === "graded") counts.graded += 1;
    else if (key === "submitted") counts.submitted += 1;
  }
  return counts;
}

/** Phrase de synthèse du jour pour l'élève. */
export function studentHeadline(counts: StudentExamCounts): string {
  const parts: string[] = [];
  if (counts.inProgress > 0) parts.push(he.studentHeadlineInProgress(counts.inProgress));
  if (counts.todo > 0) parts.push(he.studentHeadlineTodo(counts.todo));
  if (parts.length === 0 && counts.graded > 0) parts.push(he.studentHeadlineGraded(counts.graded));
  return parts.length > 0 ? parts.join(" · ") : he.studentHeadlineAllClear;
}

/** Examen à proposer en premier : celui en cours, sinon le plus récent à démarrer. */
export function nextExam(sessions: StudentExamSessionWithAttempt[]): StudentExamSessionWithAttempt | null {
  return splitStudentSessions(sessions).pending[0] ?? null;
}
