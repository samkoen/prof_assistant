import { useState } from "react";
import { resolveEditorTab, type EditorTab } from "../../utils/examEditorTab";

/** Onglet actif de l'éditeur ; l'onglet initial dépend du contenu de l'examen. */
export function useEditorTab(questionCount: number, editable: boolean) {
  const [chosen, setChosen] = useState<EditorTab | null>(null);
  return { tab: resolveEditorTab(chosen, questionCount, editable), setTab: setChosen };
}
