import { he } from "../i18n/he";

/** Message affiché si le titre ou la description d'une sous-tâche manque. */
export function taskStepDraftError(draft: { title: string; instructions: string }): string | null {
  if (!draft.instructions.trim()) return he.taskStepDescriptionRequired;
  if (!draft.title.trim()) return he.taskStepTitleRequired;
  return null;
}
