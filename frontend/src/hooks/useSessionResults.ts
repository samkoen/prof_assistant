import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type ExamSessionResults } from "../api/client";
import { he } from "../i18n/he";

/** Résultats d'une session d'examen (copies, scores, intégrité). */
export function useSessionResults(sessionId: number) {
  const [data, setData] = useState<ExamSessionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!sessionId || Number.isNaN(sessionId)) return;
    setError("");
    try {
      setData(await api<ExamSessionResults>(`/api/exams/sessions/${sessionId}/results`));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, setError, reload: load };
}
