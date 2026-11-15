import { useState } from "react";
import { api, ApiError, type Exam } from "../../api/client";
import { he } from "../../i18n/he";
import type { EditorFeedback } from "./useEditorFeedback";
import type { ExamData } from "./useExamData";

/** Titre de l'examen, édité dans l'en-tête : enregistré automatiquement à la validation (Entrée / perte du focus). */
export function useExamTitle(id: number, data: ExamData, fb: EditorFeedback) {
  const { exam, titleDraft, setExam, setTitleDraft } = data;
  const [savingTitle, setSavingTitle] = useState(false);
  const saved = exam?.title ?? "";

  const persist = async (title: string) => {
    setSavingTitle(true);
    fb.setError("");
    try {
      const body = JSON.stringify({ title });
      const next = (await api<Exam>(`/api/exams/${id}`, { method: "PATCH", body })).title;
      setExam((prev) => (prev ? { ...prev, title: next } : prev));
      setTitleDraft(next);
      fb.setSuccess(he.examTitleSaved);
    } catch (e) {
      setTitleDraft(saved);
      fb.setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setSavingTitle(false);
    }
  };

  /** Valide le brouillon : vide ou inchangé → on revient au titre enregistré, sinon on enregistre. */
  const commitTitle = async () => {
    const title = titleDraft.trim();
    if (!title || title === saved) return setTitleDraft(saved);
    await persist(title);
  };

  const cancelTitle = () => setTitleDraft(saved);

  return { savingTitle, commitTitle, cancelTitle };
}
