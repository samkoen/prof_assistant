import { he } from "../i18n/he";

export type ExamTimingForm = {
  durationMinutes: string;
  warningMinutes: string;
  autoSubmitOnTimeout: boolean;
};

export function timingFromExam(exam: {
  duration_minutes: number;
  warning_minutes: number;
  auto_submit_on_timeout: boolean;
}): ExamTimingForm {
  return {
    durationMinutes: String(exam.duration_minutes),
    warningMinutes: String(exam.warning_minutes),
    autoSubmitOnTimeout: exam.auto_submit_on_timeout,
  };
}

export function validateExamTiming(form: ExamTimingForm): string | null {
  const duration = Number(form.durationMinutes);
  const warning = Number(form.warningMinutes);
  if (!Number.isFinite(duration) || duration < 1 || duration > 300) {
    return he.examDurationInvalid;
  }
  if (!Number.isFinite(warning) || warning < 1 || warning > 60) {
    return he.examWarningInvalid;
  }
  return null;
}

export function timingActivatePayload(form: ExamTimingForm) {
  return {
    duration_minutes: Number(form.durationMinutes),
    warning_minutes: Number(form.warningMinutes),
    auto_submit_on_timeout: form.autoSubmitOnTimeout,
  };
}
