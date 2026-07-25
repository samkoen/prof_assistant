const storageKey = (sessionId: number) => `exam_session_token_${sessionId}`;

export const EXAM_SESSION_TOKEN_HEADER = "X-Exam-Session-Token";

export function getExamSessionToken(sessionId: number): string | null {
  try {
    return sessionStorage.getItem(storageKey(sessionId));
  } catch {
    return null;
  }
}

export function setExamSessionToken(
  sessionId: number,
  token: string | null | undefined,
): void {
  if (!token) return;
  try {
    sessionStorage.setItem(storageKey(sessionId), token);
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearExamSessionToken(sessionId: number): void {
  try {
    sessionStorage.removeItem(storageKey(sessionId));
  } catch {
    /* ignore */
  }
}

export function examSessionTokenHeaders(
  sessionId: number,
): Record<string, string> {
  const token = getExamSessionToken(sessionId);
  return token ? { [EXAM_SESSION_TOKEN_HEADER]: token } : {};
}

export function rememberAttemptSessionToken(
  sessionId: number,
  attempt: { session_token?: string | null } | null | undefined,
): void {
  if (attempt?.session_token) {
    setExamSessionToken(sessionId, attempt.session_token);
  }
}
