import type { ExamAttempt, ExamSession } from "../api/client";
import { he } from "../i18n/he";

export function studentExamChipProps(session: ExamSession, attempt: ExamAttempt | null) {
  if (attempt?.submitted_at) {
    return { label: he.alreadySubmitted, color: "default" as const };
  }
  if (attempt?.started_at) {
    return { label: he.examInProgress, color: "success" as const };
  }
  if (session.status === "closed") {
    return { label: he.examClosed, color: "default" as const };
  }
  return { label: he.examInProgress, color: "success" as const };
}
