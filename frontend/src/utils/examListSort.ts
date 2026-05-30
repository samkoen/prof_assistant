import type { ExamSession } from "../api/client";

export function examSessionDisplayIso(session: ExamSession | undefined): string | null {
  if (!session) return null;
  return session.activated_at ?? session.closed_at ?? null;
}

export function formatExamDateTime(iso: string): string {
  return new Date(iso).toLocaleString("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
