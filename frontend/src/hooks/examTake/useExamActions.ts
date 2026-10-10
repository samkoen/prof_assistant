import { useCallback, useRef, useState } from "react";
import { api, ApiError, type ExamAttempt } from "../../api/client";
import { he } from "../../i18n/he";
import { clearExamSessionToken, examSessionTokenHeaders, rememberAttemptSessionToken } from "../../utils/examSessionToken";
import { buildAnswersPayload } from "../../utils/examTake";
import type { ExamAnswers } from "./useExamAnswers";
import type { ExamLoader } from "./useExamLoader";

function errorText(e: unknown): string {
  return e instanceof ApiError ? e.message : he.errorGeneric;
}

/** Remise de la copie (officielle ou entraînement), acceptation des règles et nouvelle tentative. */
export function useExamActions(id: number, loader: ExamLoader, store: ExamAnswers) {
  // Tout ce qui est destructuré ici est stable entre rendus (setters, refs, useCallback).
  const { paperRef, setAttempt, setPaper, setPhase, setSuccess, setAutoSubmitted, setError } = loader;
  const { load, loadPractice, loadReview, loadPracticeReview } = loader;
  const { snapshot } = store;
  const [submitting, setSubmitting] = useState(false);
  const [startingPractice, setStartingPractice] = useState(false);
  const [acceptingRules, setAcceptingRules] = useState(false);
  const submittingRef = useRef(false);

  const payloadNow = useCallback(() => {
    const paper = paperRef.current;
    if (!paper?.questions.length) return null;
    const { answers, texts } = snapshot();
    return buildAnswersPayload(paper.questions, answers, texts);
  }, [paperRef, snapshot]);

  /** Exécute `task` en garantissant une seule remise à la fois. */
  const guarded = useCallback(
    async (task: (payload: NonNullable<ReturnType<typeof payloadNow>>) => Promise<void>) => {
      const payload = payloadNow();
      if (!payload || submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setError("");
      try {
        await task(payload);
      } catch (e) {
        setError(errorText(e));
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [payloadNow, setError],
  );

  const submit = useCallback(
    (force = false) =>
      guarded(async (payload) => {
        const headers = examSessionTokenHeaders(id);
        await api(`/api/exams/sessions/${id}/answers`, { method: "PUT", headers, body: JSON.stringify(payload) });
        const res = await api<ExamAttempt>(`/api/exams/sessions/${id}/submit`, { method: "POST", headers, body: JSON.stringify(payload) });
        clearExamSessionToken(id);
        setAttempt(res);
        setPaper((prev) => (prev ? { ...prev, attempt: { ...prev.attempt, ...res } } : prev));
        setSuccess(force ? he.examAutoSubmitted : he.examSubmitted);
        setAutoSubmitted(force);
        setPhase("final");
        await loadReview();
      }),
    [guarded, id, loadReview, setAttempt, setPaper, setSuccess, setAutoSubmitted, setPhase],
  );

  const submitPractice = useCallback(
    () =>
      guarded(async (payload) => {
        const res = await api<ExamAttempt>(`/api/exams/sessions/${id}/practice/submit`, { method: "POST", body: JSON.stringify(payload) });
        setAttempt(res);
        setSuccess(he.practiceSubmitted);
        setPhase("practice_review");
        await loadPracticeReview();
      }),
    [guarded, id, loadPracticeReview, setAttempt, setSuccess, setPhase],
  );

  const runStarting = async (task: () => Promise<void>) => {
    setStartingPractice(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setStartingPractice(false);
    }
  };

  const retryTirgoul = () =>
    runStarting(async () => {
      await api(`/api/exams/sessions/${id}/open`, { method: "POST" });
      setPhase("exam");
      await load();
    });

  const startPractice = () =>
    runStarting(async () => {
      setAttempt(await api<ExamAttempt>(`/api/exams/sessions/${id}/practice/start`, { method: "POST" }));
      await loadPractice();
    });

  const acceptRules = async () => {
    setAcceptingRules(true);
    setError("");
    try {
      const res = await api<ExamAttempt>(`/api/exams/sessions/${id}/accept-rules`, { method: "POST", headers: examSessionTokenHeaders(id) });
      rememberAttemptSessionToken(id, res);
      setAttempt(res);
      setPaper((prev) => (prev ? { ...prev, attempt: { ...prev.attempt, ...res } } : prev));
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setAcceptingRules(false);
    }
  };

  return { submitting, startingPractice, acceptingRules, submit, submitPractice, retryTirgoul, startPractice, acceptRules };
}

export type ExamActions = ReturnType<typeof useExamActions>;
