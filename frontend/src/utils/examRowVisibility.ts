import type { Exam, ExamSession } from "../api/client";
import { examSessionDisplayIso } from "./examListSort";

type VisibilityInput = {
  exam: Pick<Exam, "hidden_from_students">;
  session?: Pick<ExamSession, "status" | "activated_at" | "closed_at">;
};

/** Un élève ne voit que les sessions ouvertes ou clôturées d'une matala non masquée. */
export function isVisibleToStudents({ exam, session }: VisibilityInput): boolean {
  if (exam.hidden_from_students === true) return false;
  return session?.status === "active" || session?.status === "closed";
}

/** Tri par date de la matala ; sans date (pas encore envoyée) = tout en haut du tri récent → ancien. */
export function examDateSortValue(
  session: Pick<ExamSession, "activated_at" | "closed_at"> | undefined,
): number {
  const iso = examSessionDisplayIso(session);
  const time = iso ? new Date(iso).getTime() : Number.NaN;
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}
