import { useCallback, useMemo, useState } from "react";
import { api, ApiError, type CourseOffering, type StudentExamSessionWithAttempt, type StudentOfferingExamsBoard } from "../api/client";
import { he } from "../i18n/he";
import { splitStudentSessions } from "../utils/studentExams";
import { usePolledLoader } from "./usePolledLoader";

const REFRESH_MS = 15000;

/** Examens d'un cours pour l'élève, rafraîchis régulièrement. */
export function useStudentOfferingExams(offeringId: number) {
  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [sessions, setSessions] = useState<StudentExamSessionWithAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!offeringId || Number.isNaN(offeringId)) return;
    try {
      const board = await api<StudentOfferingExamsBoard>(`/api/exams/sessions/offering/${offeringId}/student-board`);
      setOffering(board.offering);
      setSessions(board.sessions);
      setError("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [offeringId]);

  usePolledLoader(load, REFRESH_MS);

  const groups = useMemo(() => splitStudentSessions(sessions), [sessions]);
  return { offering, sessions, ...groups, loading, error, setError, reload: load };
}
