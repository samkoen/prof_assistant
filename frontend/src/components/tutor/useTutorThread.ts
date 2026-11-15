import { useCallback, useEffect, useState } from "react";
import { fetchTutorThread, sendTutorMessage, type TutorThread } from "../../api/aiTutor";
import { notifyBillingChanged } from "../../api/billing";
import { ApiError } from "../../api/client";
import { he } from "../../i18n/he";
import type { TutorAction } from "../../utils/tutorQuickActions";

interface TutorThreadOptions {
  sessionId: number;
  questionId: number;
  forPractice: boolean;
  open: boolean;
  /** Renvoie vrai si l'erreur était « crédits requis » (fenêtre d'achat ouverte). */
  onCreditsError: (e: unknown) => boolean;
}

export function useTutorThread({ sessionId, questionId, forPractice, open, onCreditsError }: TutorThreadOptions) {
  const [thread, setThread] = useState<TutorThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || thread) return;
    setLoading(true);
    fetchTutorThread(sessionId, questionId, forPractice)
      .then(setThread)
      .catch((e) => setError(e instanceof ApiError ? e.message : he.errorGeneric))
      .finally(() => setLoading(false));
  }, [open, thread, sessionId, questionId, forPractice]);

  const send = useCallback(
    async (text: string, action: TutorAction | null = null) => {
      const wasCharged = thread?.charged ?? false;
      setSending(true);
      setPending(text);
      setError("");
      try {
        const next = await sendTutorMessage(sessionId, questionId, { text, action, forPractice });
        setThread(next);
        if (!wasCharged) notifyBillingChanged();
        return true;
      } catch (e) {
        if (!onCreditsError(e)) setError(e instanceof ApiError ? e.message : he.errorGeneric);
        return false;
      } finally {
        setSending(false);
        setPending(null);
      }
    },
    [thread, sessionId, questionId, forPractice, onCreditsError]
  );

  return { thread, loading, sending, pending, error, setError, send };
}
