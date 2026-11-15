import type { ExamSession } from "../api/client";
import { he } from "../i18n/he";
import type { ExamOfferingActionRules } from "./examOfferingActionRules";

/**
 * L'action principale d'une מטלה dans un קורס : une seule, évidente, selon l'état.
 * - טיוטה → הפעלה (bloquée tant qu'il n'y a pas de questions)
 * - פעיל → סגירה (fin des remises + publication des notes)
 * - נסגר sans notes publiées → פרסום ציונים
 * - נסגר et publié → ציונים
 */
export type PrimaryActionKind = "activate" | "activateBlocked" | "close" | "publish" | "grades" | "none";

type RulesLike = Pick<ExamOfferingActionRules, "showStart" | "showStartBlocked" | "showClose" | "showDeactivate" | "canViewGrades">;

export function examPrimaryAction(rules: RulesLike): PrimaryActionKind {
  if (rules.showStart) return "activate";
  if (rules.showStartBlocked) return "activateBlocked";
  if (rules.showClose && rules.showDeactivate) return "close";
  if (rules.showClose) return "publish";
  if (rules.canViewGrades) return "grades";
  return "none";
}

type SessionLike = Pick<ExamSession, "status" | "results_published" | "question_count">;

export function sessionPrimaryAction(session: SessionLike): PrimaryActionKind {
  if (session.status === "draft") return session.question_count > 0 ? "activate" : "activateBlocked";
  if (session.status === "active") return "close";
  if (!session.results_published) return "publish";
  return "grades";
}

export function primaryActionLabel(kind: PrimaryActionKind): string {
  if (kind === "activate" || kind === "activateBlocked") return he.activateExam;
  if (kind === "close") return he.closeExam;
  if (kind === "publish") return he.publishGrades;
  if (kind === "grades") return he.viewExamGrades;
  return "";
}
