import type { ExamSession } from "../api/client";
import { he } from "../i18n/he";
import type { StatusTone } from "../theme/brand";

export interface SessionStatusView {
  key: "practice" | "draft" | "active" | "awaiting_publish" | "finished";
  label: string;
  tone: StatusTone;
}

type SessionLike = Pick<ExamSession, "status" | "is_tirgoul" | "results_published">;

/** État lisible d'une session d'examen (libellé + ton de couleur). */
export function sessionStatusView(session: SessionLike): SessionStatusView {
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
