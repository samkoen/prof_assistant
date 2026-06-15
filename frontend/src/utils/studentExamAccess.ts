import type { ExamAttempt, ExamSession } from "../api/client";

/** L'élève peut ouvrir la page (démarrer, continuer ou voir le résultat). */
export function canStudentAccessExam(session: ExamSession, attempt: ExamAttempt | null): boolean {
  if (attempt?.submitted_at) return true;
  if (attempt?.started_at) return true;
  return session.status === "active";
}
