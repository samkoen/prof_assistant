import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type ExamAttempt, type ExamReview, type ExamTake, type PracticeResult } from "../../api/client";
import { he } from "../../i18n/he";
import { clearExamSessionToken, examSessionTokenHeaders, rememberAttemptSessionToken } from "../../utils/examSessionToken";
import type { SavedAnswers } from "../../utils/examTake";

export type PagePhase = "exam" | "final" | "practice" | "practice_review";

function errorText(e: unknown): string {
  return e instanceof ApiError ? e.message : he.errorGeneric;
}

function isTimedOut(attempt: ExamAttempt): boolean {
  return !!attempt.expires_at && new Date(attempt.expires_at).getTime() <= Date.now();
}

/** Chargement de la copie, de la correction et de l'historique d'entraînement ; gère la phase affichée. */
export function useExamLoader(id: number, hydrate: (saved: SavedAnswers) => void) {
  const [paper, setPaper] = useState<ExamTake | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [review, setReview] = useState<ExamReview | null>(null);
  const [practiceResults, setPracticeResults] = useState<PracticeResult[]>([]);
  const [phase, setPhase] = useState<PagePhase>("exam");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const paperRef = useRef<ExamTake | null>(null);
  paperRef.current = paper;
  const valid = Boolean(id) && !Number.isNaN(id);

  const loadPracticeHistory = useCallback(async () => {
    if (!valid) return;
    try {
      setPracticeResults(await api<PracticeResult[]>(`/api/exams/sessions/${id}/practice/history`));
    } catch {
      setPracticeResults([]);
    }
  }, [id, valid]);

  const loadReview = useCallback(async () => {
    if (!valid) return;
    try {
      setReview(await api<ExamReview>(`/api/exams/sessions/${id}/review`));
    } catch (e) {
      setReview(null);
      if (e instanceof ApiError) setError(e.message);
    }
    await loadPracticeHistory();
  }, [id, valid, loadPracticeHistory]);

  const loadPracticeReview = useCallback(async () => {
    if (!valid) return;
    try {
      setReview(await api<ExamReview>(`/api/exams/sessions/${id}/practice/review`));
    } catch {
      setReview(null);
    }
    await loadPracticeHistory();
  }, [id, valid, loadPracticeHistory]);

  const loadPractice = useCallback(async () => {
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      const data = await api<ExamTake>(`/api/exams/sessions/${id}/practice/take`);
      setPaper(data);
      setAttempt(data.attempt);
      setPhase("practice");
      setReview(null);
      setSuccess("");
      setAutoSubmitted(false);
      hydrate(data.saved_answers);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [id, valid, hydrate]);

  const showSubmitted = useCallback(
    async (data: ExamTake) => {
      clearExamSessionToken(id);
      const timedOut = isTimedOut(data.attempt);
      setSuccess(timedOut ? he.examAutoSubmitted : he.examSubmitted);
      setAutoSubmitted(timedOut);
      setPhase("final");
      await loadReview();
    },
    [id, loadReview],
  );

  const load = useCallback(async () => {
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      const data = await api<ExamTake>(`/api/exams/sessions/${id}/take`, { headers: examSessionTokenHeaders(id) });
      rememberAttemptSessionToken(id, data.attempt);
      setPaper(data);
      setAttempt(data.attempt);
      if (data.attempt.submitted_at) await showSubmitted(data);
      else if (data.attempt.practice_active) await loadPractice();
      else {
        setPhase("exam");
        setReview(null);
        setAutoSubmitted(false);
        setSuccess("");
        hydrate(data.saved_answers);
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [id, valid, showSubmitted, loadPractice, hydrate]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    paper, setPaper, paperRef, attempt, setAttempt, review, setReview, practiceResults, phase, setPhase,
    loading, error, setError, success, setSuccess, autoSubmitted, setAutoSubmitted,
    load, loadPractice, loadReview, loadPracticeReview,
  };
}

export type ExamLoader = ReturnType<typeof useExamLoader>;
