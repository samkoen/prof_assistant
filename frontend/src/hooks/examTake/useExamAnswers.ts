import { useCallback, useRef, useState } from "react";
import { answersFromSaved, textsFromSaved, type SavedAnswers } from "../../utils/examTake";

export type AnswersSnapshot = { answers: Record<number, number[]>; texts: Record<number, string> };

/** Réponses de l'élève (choix + textes libres) avec accès « instantané » pour les callbacks asynchrones. */
export function useExamAnswers() {
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const answersRef = useRef(answers);
  const textsRef = useRef(textAnswers);
  answersRef.current = answers;
  textsRef.current = textAnswers;

  const hydrate = useCallback((saved: SavedAnswers) => {
    setAnswers(answersFromSaved(saved));
    setTextAnswers(textsFromSaved(saved));
  }, []);

  const setSingle = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: [optionId] }));
  };

  const toggleMultiple = (questionId: number, optionId: number, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      const next = checked ? [...current, optionId] : current.filter((x) => x !== optionId);
      return { ...prev, [questionId]: next };
    });
  };

  const setOpenText = (questionId: number, value: string) => {
    setTextAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const snapshot = useCallback((): AnswersSnapshot => ({ answers: answersRef.current, texts: textsRef.current }), []);

  return { answers, textAnswers, hydrate, setSingle, toggleMultiple, setOpenText, snapshot };
}

export type ExamAnswers = ReturnType<typeof useExamAnswers>;
