import { he } from "../../i18n/he";

export type SessionActionKind = "close" | "publish" | "deactivate" | "reopen";

type SessionEndpoint = "close" | "deactivate" | "reopen";

export interface SessionActionCopy {
  title: string;
  message: string;
  confirmLabel: string;
  /** Message de succès (suivi du titre de la מטלה). */
  done: string;
  color: "primary" | "warning" | "success";
  /** Segment d'URL : POST /api/exams/sessions/{id}/{endpoint}. */
  endpoint: SessionEndpoint;
}

export const SESSION_ACTION_COPY: Record<SessionActionKind, SessionActionCopy> = {
  close: { title: he.closeExam, message: he.closeExamConfirm, confirmLabel: he.closeExam, done: he.examClosedSuccess, color: "primary", endpoint: "close" },
  publish: { title: he.publishGrades, message: he.publishGradesConfirm, confirmLabel: he.publishGrades, done: he.taskPublished, color: "primary", endpoint: "close" },
  deactivate: {
    title: he.cancelActivation,
    message: he.cancelActivationConfirm,
    confirmLabel: he.cancelActivation,
    done: he.examDeactivated,
    color: "warning",
    endpoint: "deactivate",
  },
  reopen: { title: he.reopenExam, message: he.reopenExamConfirm, confirmLabel: he.reopenExam, done: he.examReopened, color: "success", endpoint: "reopen" },
};
