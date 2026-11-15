/** Façon d'ajouter des questions : écrire, générer avec l'AI ou coller un texte. */
export type QuestionAddMethod = "manual" | "gemini" | "paste";

export const ADD_METHODS: QuestionAddMethod[] = ["gemini", "paste", "manual"];

export const START_PARAM = "start";

/** Lit la méthode de départ choisie à la création (?start=…) ; null si absente ou invalide. */
export function parseStartMethod(value: string | null): QuestionAddMethod | null {
  return ADD_METHODS.find((m) => m === value) ?? null;
}

/**
 * Le panneau d'ajout est-il ouvert à l'arrivée dans l'éditeur ?
 * Oui pour un examen modifiable vide, ou quand une méthode de départ est demandée.
 */
export function addPanelOpenInitially(questionCount: number, editable: boolean, start: QuestionAddMethod | null): boolean {
  if (!editable) return false;
  return questionCount === 0 || start !== null;
}
