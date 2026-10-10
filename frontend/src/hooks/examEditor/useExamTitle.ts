import { useState } from "react";
import { api, ApiError, type Exam } from "../../api/client";
import { he } from "../../i18n/he";
import type { EditorFeedback } from "./useEditorFeedback";
import type { ExamData } from "./useExamData";

/** Titre de l'examen : brouillon, validation et sauvegarde. */
export function useExamTitle(id: number, data: ExamData, fb: EditorFeedback) {
  const { exam, baseline, titleDraft, setExam, setTitleDraft, setBaseline } = data;
  const [savingTitle, setSavingTitle] = useState(false);
  const titleValid = titleDraft.trim().length > 0;
  const titleChanged = titleDraft.trim() !== (baseline?.title ?? exam?.title ?? "");

  const applySaved = (title: string) => {
    setExam((prev) => (prev ? { ...prev, title } : prev));
    setTitleDraft(title);
    setBaseline((prev) => (prev ? { ...prev, title } : prev));
  };

  const saveTitle = async (): Promise<boolean> => {
    if (!titleValid) {
      fb.setError(he.examTitle);
      return false;
    }
    if (!titleChanged) return true;
    setSavingTitle(true);
    fb.setError("");
    fb.setSuccess("");
    try {
      const body = JSON.stringify({ title: titleDraft.trim() });
      applySaved((await api<Exam>(`/api/exams/${id}`, { method: "PATCH", body })).title);
      return true;
    } catch (e) {
      fb.setError(e instanceof ApiError ? e.message : he.errorGeneric);
      return false;
    } finally {
      setSavingTitle(false);
    }
  };

  return { titleValid, titleChanged, savingTitle, saveTitle };
}
