import { useCallback, useEffect, useRef } from "react";
import { api, type ExamAttempt } from "../api/client";
import { examSessionTokenHeaders } from "../utils/examSessionToken";

type IntegrityEvent = {
  event_type: "tab_hidden" | "tab_visible";
  occurred_at: string;
  duration_seconds?: number;
};

export function useExamIntegrity(
  enabled: boolean,
  attemptId: number | null,
  sessionId: number | null,
  submitted: boolean
) {
  const hiddenSince = useRef<number | null>(null);
  const queue = useRef<IntegrityEvent[]>([]);
  const flushTimer = useRef<number | null>(null);

  const flush = useCallback(async () => {
    if (!attemptId || !sessionId || queue.current.length === 0) return;
    const batch = queue.current.splice(0, queue.current.length);
    try {
      await api<ExamAttempt>(`/api/exams/attempts/${attemptId}/integrity-events`, {
        method: "POST",
        headers: examSessionTokenHeaders(sessionId),
        body: JSON.stringify({ events: batch }),
      });
    } catch {
      queue.current.unshift(...batch);
    }
  }, [attemptId, sessionId]);

  const enqueue = useCallback(
    (event: IntegrityEvent) => {
      queue.current.push(event);
      if (flushTimer.current != null) window.clearTimeout(flushTimer.current);
      flushTimer.current = window.setTimeout(() => {
        flushTimer.current = null;
        flush();
      }, 800);
    },
    [flush]
  );

  useEffect(() => {
    if (!enabled || !attemptId || submitted) return;

    const onVisibility = () => {
      if (document.hidden) {
        hiddenSince.current = Date.now();
        enqueue({
          event_type: "tab_hidden",
          occurred_at: new Date().toISOString(),
        });
      } else if (hiddenSince.current != null) {
        const sec = Math.max(1, Math.round((Date.now() - hiddenSince.current) / 1000));
        hiddenSince.current = null;
        enqueue({
          event_type: "tab_visible",
          occurred_at: new Date().toISOString(),
          duration_seconds: sec,
        });
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (flushTimer.current != null) window.clearTimeout(flushTimer.current);
      void flush();
    };
  }, [enabled, attemptId, submitted, enqueue, flush]);
}
