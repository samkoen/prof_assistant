import { api, ApiError } from "../api/client";
import type { GeminiGenerationSession } from "../types/geminiQuestionSeries";
import { he } from "../i18n/he";

export function isGeminiTimeoutError(e: unknown): boolean {
  if (!(e instanceof ApiError)) return false;
  const msg = e.message.toLowerCase();
  return (
    msg.includes("ארכה יותר") ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("פסק זמן")
  );
}

export function resolveGeminiApiError(e: unknown): string {
  if (!(e instanceof ApiError)) return he.errorGeneric;
  if (isGeminiTimeoutError(e)) return he.geminiGenerationTimeout;
  const msg = e.message.toLowerCase();
  if (msg.includes("quota") || msg.includes("מכסת") || msg.includes("gemini")) {
    return he.geminiQuotaExceeded;
  }
  if (msg.includes("עמוס") || msg.includes("busy") || msg.includes("429")) {
    return he.geminiServiceBusy;
  }
  return e.message;
}

export async function fetchNextGeminiBatch(
  session: GeminiGenerationSession,
): Promise<GeminiGenerationSession> {
  return api<GeminiGenerationSession>(`/api/gemini-sessions/${session.id}/next-batch`, {
    method: "POST",
  });
}

export async function refreshGeminiSession(sessionId: number): Promise<GeminiGenerationSession> {
  return api<GeminiGenerationSession>(`/api/gemini-sessions/${sessionId}`);
}

export async function fetchRemainingGeminiBatches(
  session: GeminiGenerationSession,
  onBatch?: (updated: GeminiGenerationSession) => void,
): Promise<GeminiGenerationSession> {
  let current = session;
  while (current.generation_progress && !current.generation_progress.complete) {
    current = await fetchNextGeminiBatch(current);
    onBatch?.(current);
  }
  return current;
}

export function geminiBatchProgressLabel(session: GeminiGenerationSession | null): string | null {
  const progress = session?.generation_progress;
  if (!progress || progress.complete) return null;
  const { generated_questions, total_questions, completed_batches, total_batches } = progress;
  return `${generated_questions} / ${total_questions} (${completed_batches}/${total_batches})`;
}
