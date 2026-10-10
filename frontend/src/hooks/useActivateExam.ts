import { useState } from "react";
import { api, ApiError, examMatchesOffering, type CourseOffering, type Exam, type ExamSession } from "../api/client";
import { he } from "../i18n/he";
import {
  timingActivatePayload,
  timingFromExam,
  validateExamTiming,
  type ExamTimingForm,
} from "../utils/examActivateTiming";

type Options = {
  offerings: CourseOffering[];
  reload: () => Promise<void>;
  onError: (message: string) => void;
};

const DEFAULT_TIMING: ExamTimingForm = { durationMinutes: "45", warningMinutes: "10", autoSubmitOnTimeout: true };

function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : he.errorGeneric;
}

/** Offres compatibles avec la portée de l'examen (cours, année, semestre, groupe). */
export function compatibleOfferings(exam: Exam | null, offerings: CourseOffering[]): CourseOffering[] {
  if (!exam) return [];
  return offerings.filter((o) => o.catalog_course_id === exam.catalog_course_id && examMatchesOffering(exam, o));
}

/** Dialogue de mise en ligne d'un examen : sélection du groupe + minutage. */
export function useActivateExam({ offerings, reload, onError }: Options) {
  const [open, setOpen] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [offeringId, setOfferingId] = useState("");
  const [timing, setTiming] = useState<ExamTimingForm>(DEFAULT_TIMING);

  const start = (target: Exam, presetOfferingId = "") => {
    setExam(target);
    setOfferingId(presetOfferingId);
    setTiming(timingFromExam(target));
    setOpen(true);
  };

  const startFromSession = async (session: ExamSession) => {
    try {
      start(await api<Exam>(`/api/exams/${session.exam_id}`), String(session.offering_id));
    } catch (e) {
      onError(errorMessage(e));
    }
  };

  const submit = async () => {
    if (!exam || !offeringId) return;
    const timingError = validateExamTiming(timing);
    if (timingError) return onError(timingError);
    try {
      const body = { offering_id: Number(offeringId), integrity_mode_enabled: true, ...timingActivatePayload(timing) };
      await api(`/api/exams/${exam.id}/activate`, { method: "POST", body: JSON.stringify(body) });
      setOpen(false);
      await reload();
    } catch (e) {
      onError(errorMessage(e));
    }
  };

  return {
    dialog: {
      open,
      exam,
      offerings: compatibleOfferings(exam, offerings),
      offeringId,
      timing,
      onOfferingChange: setOfferingId,
      onTimingChange: setTiming,
      onClose: () => setOpen(false),
      onActivate: submit,
    },
    start,
    startFromSession,
  };
}
