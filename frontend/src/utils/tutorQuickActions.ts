import { he } from "../i18n/he";

export type TutorAction =
  | "why_wrong"
  | "why_right"
  | "step_by_step"
  | "similar_example"
  | "quiz_me"
  | "full_explanation";

export interface TutorQuickAction {
  action: TutorAction;
  label: string;
}

/** Boutons de démarrage rapide ; « pourquoi » dépend de la réussite (questions ouvertes : pas de « pourquoi »). */
export function tutorStarterActions(isCorrect: boolean | null): TutorQuickAction[] {
  const why: TutorQuickAction[] =
    isCorrect === null
      ? []
      : [
          isCorrect
            ? { action: "why_right", label: he.tutorQuickWhyRight }
            : { action: "why_wrong", label: he.tutorQuickWhyWrong },
        ];
  return [
    ...why,
    { action: "step_by_step", label: he.tutorQuickStepByStep },
    { action: "similar_example", label: he.tutorQuickSimilarExample },
    { action: "quiz_me", label: he.tutorQuickQuizMe },
  ];
}

export const fullExplanationAction: TutorQuickAction = {
  action: "full_explanation",
  label: he.tutorQuickFullExplanation,
};

/** Le bouton « explication complète » reste disponible tant qu'il reste des messages. */
export function canSendTutorMessage(text: string, remaining: number, busy: boolean): boolean {
  return !busy && remaining > 0 && text.trim().length > 0;
}
