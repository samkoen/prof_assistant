export type EditorTab = "questions" | "add" | "settings";

/** Onglet d'ouverture : un examen vide et modifiable s'ouvre directement sur l'ajout de questions. */
export function initialEditorTab(questionCount: number, editable: boolean): EditorTab {
  return questionCount === 0 && editable ? "add" : "questions";
}

/** L'onglet demandé est-il disponible ? « Ajout » n'existe que pour un examen modifiable. */
export function resolveEditorTab(tab: EditorTab | null, questionCount: number, editable: boolean): EditorTab {
  if (tab === null) return initialEditorTab(questionCount, editable);
  return tab === "add" && !editable ? "questions" : tab;
}
