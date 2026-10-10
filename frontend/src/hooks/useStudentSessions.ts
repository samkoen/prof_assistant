import { useCallback, useMemo, useState } from "react";
import { api, ApiError, type StudentExamSessionWithAttempt } from "../api/client";
import { he } from "../i18n/he";
import { countStudentExams, splitStudentSessions } from "../utils/studentExams";
import { usePolledLoader } from "./usePolledLoader";

const REFRESH_MS = 15000;

/** Tous les examens de l'élève (avec sa tentative), rafraîchis régulièrement sans écran de chargement. */
export function useStudentSessions() {
  const [sessions, setSessions] = useState<StudentExamSessionWithAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setSessions(await api<StudentExamSessionWithAttempt[]>("/api/exams/sessions/mine/student-board"));
      setError("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, []);

  usePolledLoader(load, REFRESH_MS);

  const groups = useMemo(() => splitStudentSessions(sessions), [sessions]);
  const counts = useMemo(() => countStudentExams(sessions), [sessions]);
  return { sessions, ...groups, counts, loading, error, setError, reload: load };
}
