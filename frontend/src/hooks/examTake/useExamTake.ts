import { useExamIntegrity } from "../useExamIntegrity";
import { useExamQuestionScrollSpy } from "../useExamQuestionScrollSpy";
import { countAnsweredQuestions, findNextUnansweredIndex, scrollToExamQuestion } from "../../utils/studentExamQuestionNav";
import { useExamActions } from "./useExamActions";
import { useExamAnswers } from "./useExamAnswers";
import { useExamAutosave } from "./useExamAutosave";
import { useExamLoader } from "./useExamLoader";
import { useExamTimer, useTabHidden } from "./useExamTimer";

/** Orchestre la passation d'un examen : chargement, réponses, sauvegarde, minuteur, remise et navigation. */
export function useExamTake(id: number) {
  const store = useExamAnswers();
  const loader = useExamLoader(id, store.hydrate);
  const { paper, attempt, phase } = loader;

  const integrityActive = Boolean(paper?.integrity_mode_enabled);
  const rulesAcceptedAt = attempt?.rules_accepted_at ?? paper?.attempt.rules_accepted_at;
  const rulesPending = Boolean(integrityActive && paper && !rulesAcceptedAt && !paper.attempt.submitted_at && phase === "exam");
  const submitted = phase === "final" || phase === "practice_review";
  const examInProgress = integrityActive && Boolean(attempt?.started_at) && phase === "exam";

  const actions = useExamActions(id, loader, store);
  useExamAutosave(id, loader, store, rulesPending);
  const timer = useExamTimer(loader, actions, rulesPending);
  const tabHidden = useTabHidden(examInProgress);
  useExamIntegrity(examInProgress, attempt?.id ?? null, id || null, submitted);

  const questions = paper?.questions ?? [];
  const showNav = phase === "exam" && !rulesPending && questions.length > 0;
  const activeIndex = useExamQuestionScrollSpy(questions.length, showNav);
  const answeredCount = paper ? countAnsweredQuestions(questions, store.answers, store.textAnswers) : 0;
  const allAnswered = questions.length > 0 && answeredCount >= questions.length;

  const goNextUnanswered = () => {
    const next = findNextUnansweredIndex(questions, store.answers, activeIndex, store.textAnswers);
    if (next != null) scrollToExamQuestion(next);
  };

  return {
    store, loader, actions, timer,
    integrityActive, rulesPending, submitted, examInProgress, tabHidden,
    showNav, activeIndex, answeredCount, allAnswered, goNextUnanswered,
  };
}

export type ExamTakeState = ReturnType<typeof useExamTake>;
