import { useState } from "react";
import type { Question } from "../../api/client";
import { he } from "../../i18n/he";
import { useEditorFeedback } from "./useEditorFeedback";
import { useExamChanges } from "./useExamChanges";
import { useExamData } from "./useExamData";
import { useExamTitle } from "./useExamTitle";
import { useQcmImport } from "./useQcmImport";
import { useQuestionOps } from "./useQuestionOps";

/** Boîte de dialogue question : création (question vide) ou édition. */
function useQuestionDialog() {
  const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  return {
    question: questionToEdit,
    open: Boolean(questionToEdit) || createOpen,
    openEdit: (q: Question) => {
      setCreateOpen(false);
      setQuestionToEdit(q);
    },
    openCreate: () => {
      setQuestionToEdit(null);
      setCreateOpen(true);
    },
    close: () => {
      setQuestionToEdit(null);
      setCreateOpen(false);
    },
  };
}

/** Assemble tous les morceaux d'état de l'éditeur d'examen. */
export function useExamEditor(id: number, offeringId: number | null) {
  const fb = useEditorFeedback();
  const data = useExamData(id, offeringId, fb.setError);
  const title = useExamTitle(id, data, fb);
  const changes = useExamChanges(id, data, title, fb);
  const ops = useQuestionOps(id, data, fb);
  const importer = useQcmImport(id, data.load, fb);
  const dialog = useQuestionDialog();

  const saveTitleOnly = async () => {
    if (await title.saveTitle()) fb.setSuccess(he.examTitleSaved);
  };

  return { fb, data, title, changes, ops, importer, dialog, saveTitleOnly };
}

export type ExamEditor = ReturnType<typeof useExamEditor>;
