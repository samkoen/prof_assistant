import type { ExamSession } from "../api/client";
import { he } from "../i18n/he";
import type { StatusTone } from "../theme/brand";

export interface SessionStatusView {
  key: "practice" | "draft" | "active" | "awaiting_publish" | "finished" | "grading_locked";
  label: string;
  tone: StatusTone;
}

type SessionLike = Pick<ExamSession, "status" | "is_tirgoul" | "results_published"> & {
  grading_locked?: boolean;
  kind?: ExamSession["kind"];
};

function isPracticeSession(session: SessionLike): boolean {
  return Boolean(session.is_tirgoul || session.kind === "tirgoul" || session.kind === "task");
}

/** État lisible d'une session d'examen (libellé + ton de couleur). */
export function sessionStatusView(session: SessionLike): SessionStatusView {
  if (isPracticeSession(session) && session.grading_locked) {
    return { key: "grading_locked", label: he.gradingLocked, tone: "warning" };
  }
  if (isPracticeSession(session) && session.status === "draft") {
    return { key: "draft", label: he.practiceNotDeployed, tone: "neutral" };
  }
  if (session.is_tirgoul) return { key: "practice", label: he.tirgoulChip, tone: "info" };
  if (session.status === "draft") return { key: "draft", label: he.examDraftStatus, tone: "neutral" };
  if (session.status === "active") return { key: "active", label: he.examStatusActive, tone: "success" };
  if (!session.results_published) {
    return { key: "awaiting_publish", label: he.examStatusAwaitingPublish, tone: "warning" };
  }
  return { key: "finished", label: he.examStatusFinished, tone: "violet" };
}

/** Page où agir sur la session : édition si brouillon, sinon résultats. */
export function sessionTargetPath(session: Pick<ExamSession, "id" | "exam_id" | "offering_id" | "status">): string {
  if (session.status === "draft") return `/teacher/exams/${session.exam_id}/edit`;
  return `/teacher/courses/${session.offering_id}/exams/sessions/${session.id}/results`;
}
