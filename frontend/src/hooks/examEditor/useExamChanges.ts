import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../api/client";
import { he } from "../../i18n/he";
import { questionsFingerprint, revertExamQuestionsToBaseline } from "../../utils/examEditorChanges";
import type { EditorFeedback } from "./useEditorFeedback";
import type { ExamData } from "./useExamData";
import type { useExamTitle } from "./useExamTitle";

type TitleState = ReturnType<typeof useExamTitle>;

/** Avertit le navigateur quand l'onglet est fermé avec des changements non enregistrés. */
function useLeaveWarning(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);
}

/** Changements non enregistrés : détection, annulation (retour au point de référence) et sauvegarde. */
export function useExamChanges(id: number, data: ExamData, title: TitleState, fb: EditorFeedback) {
  const { exam, baseline, setExam, setTitleDraft, setBaseline, load } = data;
  const [discarding, setDiscarding] = useState(false);
  const questionsChanged = useMemo(() => {
    if (!exam || !baseline) return false;
    return questionsFingerprint(exam.questions) !== questionsFingerprint(baseline.questions);
  }, [exam, baseline]);
  const hasChanges = title.titleChanged || questionsChanged;
  useLeaveWarning(hasChanges);

  const discard = async () => {
    if (!baseline || !exam || !hasChanges) return;
    setDiscarding(true);
    fb.setError("");
    try {
      setTitleDraft(baseline.title);
      if (questionsChanged) {
        await revertExamQuestionsToBaseline(id, baseline.questions, exam.questions);
        await load();
      } else {
        setExam((prev) => (prev ? { ...prev, title: baseline.title } : prev));
      }
      fb.setSuccess(he.examChangesDiscarded);
    } catch (e) {
      fb.setError(e instanceof ApiError ? e.message : he.errorGeneric);
    } finally {
      setDiscarding(false);
    }
  };

  const save = async () => {
    if (!title.titleValid) return fb.setError(he.examTitleRequired);
    if (!(await title.saveTitle()) || !exam) return;
    setBaseline({ title: data.titleDraft.trim(), questions: exam.questions });
    fb.setSuccess(he.examSaved);
  };

  return { hasChanges, discarding, discard, save };
}
