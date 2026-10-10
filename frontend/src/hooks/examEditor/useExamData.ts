import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type ExamDetail, type ExamSession, type Question, type TeacherOfferingExamsBoard } from "../../api/client";
import { he } from "../../i18n/he";

export type ExamBaseline = { title: string; questions: Question[] };

function validId(id: number): boolean {
  return Boolean(id) && !Number.isNaN(id);
}

async function fetchSession(id: number, offeringId: number | null): Promise<ExamSession | undefined> {
  if (!offeringId || !validId(id)) return undefined;
  try {
    const board = await api<TeacherOfferingExamsBoard>(`/api/exams/sessions/offering/${offeringId}/teacher-board`);
    return board.sessions.find((s) => s.exam_id === id);
  } catch {
    return undefined;
  }
}

/** Examen chargé, point de référence (pour annuler), session liée et rechargements. */
export function useExamData(id: number, offeringId: number | null, setError: (message: string) => void) {
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [session, setSession] = useState<ExamSession | undefined>();
  const [titleDraft, setTitleDraft] = useState("");
  const [baseline, setBaseline] = useState<ExamBaseline | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!validId(id)) return;
    setLoading(true);
    setError("");
    try {
      const data = await api<ExamDetail>(`/api/exams/${id}`);
      setExam(data);
      setTitleDraft(data.title);
      setBaseline((prev) => prev ?? { title: data.title, questions: data.questions });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [id, setError]);

  const loadSession = useCallback(async () => setSession(await fetchSession(id, offeringId)), [id, offeringId]);
  const refreshContext = useCallback(async () => {
    await Promise.all([load(), loadSession()]);
  }, [load, loadSession]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const syncQuestions = useCallback((update: (questions: Question[]) => Question[]) => {
    setExam((prev) => {
      if (!prev) return prev;
      const questions = update(prev.questions);
      return { ...prev, questions, question_count: questions.length };
    });
    setBaseline((prev) => (prev ? { ...prev, questions: update(prev.questions) } : prev));
  }, []);

  return { exam, setExam, session, titleDraft, setTitleDraft, baseline, setBaseline, loading, load, refreshContext, syncQuestions };
}

export type ExamData = ReturnType<typeof useExamData>;
