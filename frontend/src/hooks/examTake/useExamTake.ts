import { useExamIntegrity } from "../useExamIntegrity";
import { useExamQuestionScrollSpy } from "../useExamQuestionScrollSpy";
import { answerProgress, findNextAnswerableIndex } from "../../utils/examSections";
import { scrollToExamQuestion } from "../../utils/studentExamQuestionNav";
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
  const sections = paper?.sections ?? [];
  const maps = { answers: store.answers, textAnswers: store.textAnswers };
  // Dans une partie « N sur M », seules N réponses sont attendues : la progression se compte sur ce total.
  const progress = answerProgress(questions, sections, maps);
  const answeredCount = progress.answered;
  const requiredCount = progress.required;
  const allAnswered = questions.length > 0 && answeredCount >= requiredCount;

  const goNextUnanswered = () => {
    const next = findNextAnswerableIndex(questions, sections, maps, activeIndex);
    if (next != null) scrollToExamQuestion(next);
  };

  return {
    store, loader, actions, timer,
    integrityActive, rulesPending, submitted, examInProgress, tabHidden,
    showNav, activeIndex, answeredCount, requiredCount, allAnswered, goNextUnanswered,
  };
}

export type ExamTakeState = ReturnType<typeof useExamTake>;
