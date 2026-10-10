import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError, type CourseOffering, type Exam, type ExamSession, type TeacherOfferingExamsBoard } from "../api/client";
import { he } from "../i18n/he";

export type OfferingExamRow = { exam: Exam; session: ExamSession | undefined };

/** Associe chaque examen à sa session et sépare ouverts / clôturés. */
export function splitBoardRows(exams: Exam[], sessions: ExamSession[]) {
  const byExam = new Map(sessions.map((s) => [s.exam_id, s]));
  const rows: OfferingExamRow[] = exams.map((exam) => ({ exam, session: byExam.get(exam.id) }));
  return {
    openRows: rows.filter((r) => r.session?.status !== "closed"),
    closedRows: rows.filter((r) => r.session?.status === "closed"),
  };
}

/** Tableau des examens d'un groupe (vue professeur). Rechargement sans écran de chargement. */
export function useOfferingExamsBoard(offeringId: number) {
  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!offeringId || Number.isNaN(offeringId)) return;
    setError("");
    try {
      const board = await api<TeacherOfferingExamsBoard>(`/api/exams/sessions/offering/${offeringId}/teacher-board`);
      setOffering(board.offering);
      setExams(board.exams);
      setSessions(board.sessions);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [offeringId]);

  useEffect(() => {
    load();
  }, [load]);

  const { openRows, closedRows } = useMemo(() => splitBoardRows(exams, sessions), [exams, sessions]);
  return { offering, exams, openRows, closedRows, loading, error, setError, reload: load };
}
