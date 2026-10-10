import { useState } from "react";
import { api, ApiError, type ExamDetail, type Question } from "../../api/client";
import { he } from "../../i18n/he";
import { removeQuestionFromList } from "../../utils/examEditorChanges";
import type { EditorFeedback } from "./useEditorFeedback";
import type { ExamData } from "./useExamData";

function messageOf(e: unknown): string {
  return e instanceof ApiError ? e.message : he.errorGeneric;
}

/** Réordonner et supprimer des questions. */
export function useQuestionOps(id: number, data: ExamData, fb: EditorFeedback) {
  const { exam, setExam, syncQuestions } = data;
  const [reordering, setReordering] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(null);

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (!exam || target < 0 || target >= exam.questions.length) return;
    const ids = exam.questions.map((q) => q.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setReordering(true);
    fb.setError("");
    try {
      const body = JSON.stringify({ question_ids: ids });
      setExam(await api<ExamDetail>(`/api/exams/${id}/questions/reorder`, { method: "PUT", body }));
      fb.setSuccess(he.questionsReordered);
    } catch (e) {
      fb.setError(messageOf(e));
    } finally {
      setReordering(false);
    }
  };

  const remove = async () => {
    if (!questionToDelete) return;
    const deletedId = questionToDelete.id;
    setDeletingQuestionId(deletedId);
    fb.setError("");
    try {
      await api(`/api/exams/${id}/questions/${deletedId}`, { method: "DELETE" });
      setQuestionToDelete(null);
      fb.setSuccess(he.questionDeleted);
      syncQuestions((questions) => removeQuestionFromList(questions, deletedId));
    } catch (e) {
      fb.setError(messageOf(e));
    } finally {
      setDeletingQuestionId(null);
    }
  };

  return { reordering, move, questionToDelete, setQuestionToDelete, deletingQuestionId, remove };
}
