import { useState } from "react";
import { ApiError, type ExamSection, type ExamSectionInput } from "../../api/client";
import { assignQuestionsToSection, createSection, deleteSection, updateExamStructure, updateSection } from "../../api/examSections";
import { he } from "../../i18n/he";
import { parseScoreCap } from "../../utils/examSections";
import type { EditorFeedback } from "./useEditorFeedback";
import type { ExamData } from "./useExamData";

function messageOf(e: unknown): string {
  return e instanceof ApiError ? e.message : he.errorGeneric;
}

function upsertSection(sections: ExamSection[], saved: ExamSection): ExamSection[] {
  const exists = sections.some((s) => s.id === saved.id);
  return exists ? sections.map((s) => (s.id === saved.id ? saved : s)) : [...sections, saved];
}

/** Consigne générale, plafond de note et parties de l'examen — chaque action est enregistrée aussitôt. */
export function useExamStructure(id: number, data: ExamData, fb: EditorFeedback) {
  const { exam, setExam } = data;
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>, success: string): Promise<boolean> => {
    setBusy(true);
    fb.setError("");
    try {
      await action();
      fb.setSuccess(success);
      return true;
    } catch (e) {
      fb.setError(messageOf(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveInstructions = (text: string) => {
    const description = text.trim() || null;
    if (description === (exam?.description ?? null)) return Promise.resolve(true);
    return run(async () => {
      await updateExamStructure(id, { description });
      setExam((prev) => (prev ? { ...prev, description } : prev));
    }, he.examInstructionsSaved);
  };

  const saveScoreCap = (raw: string) => {
    const score_cap = parseScoreCap(raw);
    if (score_cap === (exam?.score_cap ?? null)) return Promise.resolve(true);
    return run(async () => {
      await updateExamStructure(id, { score_cap });
      setExam((prev) => (prev ? { ...prev, score_cap } : prev));
    }, he.examScoreCapSaved);
  };

  const saveSection = (input: ExamSectionInput, sectionId: number | null) =>
    run(async () => {
      const saved = sectionId == null ? await createSection(id, input) : await updateSection(id, sectionId, input);
      setExam((prev) => (prev ? { ...prev, sections: upsertSection(prev.sections ?? [], saved) } : prev));
    }, he.examSectionSaved);

  const removeSection = (sectionId: number) =>
    run(async () => {
      await deleteSection(id, sectionId);
      setExam((prev) => {
        if (!prev) return prev;
        const questions = prev.questions.map((q) => (q.section_id === sectionId ? { ...q, section_id: null } : q));
        return { ...prev, questions, sections: (prev.sections ?? []).filter((s) => s.id !== sectionId) };
      });
    }, he.examSectionDeleted);

  const assign = (questionIds: number[], sectionId: number | null) =>
    run(async () => {
      await assignQuestionsToSection(id, questionIds, sectionId);
      const moved = new Set(questionIds);
      setExam((prev) => (prev ? { ...prev, questions: prev.questions.map((q) => (moved.has(q.id) ? { ...q, section_id: sectionId } : q)) } : prev));
    }, he.questionSaved);

  return { busy, saveInstructions, saveScoreCap, saveSection, removeSection, assign };
}

export type ExamStructure = ReturnType<typeof useExamStructure>;
