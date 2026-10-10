import { he } from "../../i18n/he";

export type SessionActionKind = "close" | "deactivate" | "reopen";

export interface SessionActionCopy {
  title: string;
  message: string;
  confirmLabel: string;
  color: "primary" | "warning" | "success";
  /** Segment d'URL : POST /api/exams/sessions/{id}/{endpoint}. */
  endpoint: SessionActionKind;
}

export const SESSION_ACTION_COPY: Record<SessionActionKind, SessionActionCopy> = {
  close: { title: he.closeExam, message: he.closeExamConfirm, confirmLabel: he.closeExam, color: "primary", endpoint: "close" },
  deactivate: {
    title: he.cancelActivation,
    message: he.cancelActivationConfirm,
    confirmLabel: he.cancelActivation,
    color: "warning",
    endpoint: "deactivate",
  },
  reopen: { title: he.reopenExam, message: he.reopenExamConfirm, confirmLabel: he.reopenExam, color: "success", endpoint: "reopen" },
};
