import { useCallback, useEffect } from "react";
import { api, ApiError } from "../../api/client";
import { he } from "../../i18n/he";
import { examSessionTokenHeaders } from "../../utils/examSessionToken";
import { buildAnswersPayload } from "../../utils/examTake";
import type { ExamAnswers } from "./useExamAnswers";
import type { ExamLoader } from "./useExamLoader";

const DEBOUNCE_MS = 400;

/** Enregistre le brouillon 400 ms après la dernière modification (examen officiel ou entraînement). */
export function useExamAutosave(id: number, loader: ExamLoader, store: ExamAnswers, rulesPending: boolean) {
  const { phase, paperRef, setError } = loader;
  const { snapshot, answers, textAnswers } = store;
  const sessionId = loader.paper?.session_id;
  const hasQuestions = (loader.paper?.questions.length ?? 0) > 0;

  const saveDraft = useCallback(async () => {
    const paper = paperRef.current;
    if (!paper?.questions.length) return;
    const practice = phase === "practice";
    if (!practice && paper.attempt.submitted_at) return;
    const { answers: a, texts } = snapshot();
    await api(practice ? `/api/exams/sessions/${id}/practice/answers` : `/api/exams/sessions/${id}/answers`, {
      method: "PUT",
      headers: practice ? undefined : examSessionTokenHeaders(id),
      body: JSON.stringify(buildAnswersPayload(paper.questions, a, texts)),
    });
  }, [id, phase, paperRef, snapshot]);

  useEffect(() => {
    if (phase !== "exam" && phase !== "practice") return;
    if (rulesPending || !hasQuestions) return;
    const timer = window.setTimeout(() => {
      saveDraft().catch((e) => {
        if (e instanceof ApiError && e.status === 409) setError(e.message || he.examSessionTakenElsewhere);
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [answers, textAnswers, phase, rulesPending, hasQuestions, sessionId, saveDraft, setError]);
}
