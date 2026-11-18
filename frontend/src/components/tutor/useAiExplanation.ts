import { useCallback, useEffect, useState } from "react";
import { notifyBillingChanged } from "../../api/billing";
import { api, ApiError, type AiExplanation } from "../../api/client";
import { he } from "../../i18n/he";

interface AiExplanationOptions {
  sessionId: number;
  questionId: number;
  forPractice: boolean;
  open: boolean;
  /** Renvoie vrai si l'erreur était « crédits requis » (fenêtre d'achat ouverte). */
  onCreditsError: (e: unknown) => boolean;
}

/** Explication IA d'une question, demandée à l'ouverture du panneau (cache par tentative côté serveur). */
export function useAiExplanation({ sessionId, questionId, forPractice, open, onCreditsError }: AiExplanationOptions) {
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requested, setRequested] = useState(false);

  const request = useCallback(
    async (regenerate: boolean) => {
      setLoading(true);
      setError("");
      try {
        const res = await api<AiExplanation>(`/api/exams/sessions/${sessionId}/questions/${questionId}/explain`, {
          method: "POST",
          body: JSON.stringify({ regenerate, for_practice: forPractice }),
        });
        setExplanation(res.explanation);
        if (!res.from_cache) notifyBillingChanged();
      } catch (e) {
        if (!onCreditsError(e)) setError(e instanceof ApiError ? e.message : he.errorGeneric);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, questionId, forPractice, onCreditsError]
  );

  useEffect(() => {
    if (!open || requested) return;
    setRequested(true);
    void request(false);
  }, [open, requested, request]);

  return { explanation, loading, error, setError, regenerate: () => request(true) };
}
