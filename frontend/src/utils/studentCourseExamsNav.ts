/** Lien retour liste examens d'un cours avec focus sur la session quittée. */
export function studentCourseExamsPath(offeringId: number, sessionId: number): string {
  return `/student/courses/${offeringId}?focusSession=${sessionId}`;
}

export function parseFocusSessionId(value: string | null): number | null {
  if (!value) return null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function examSessionRowId(sessionId: number): string {
  return `exam-session-${sessionId}`;
}
