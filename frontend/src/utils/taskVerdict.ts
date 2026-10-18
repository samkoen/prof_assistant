import { he } from "../i18n/he";

export function verdictLabel(verdict: string | null): string {
  if (verdict === "done") return he.taskVerdictDone;
  if (verdict === "partial") return he.taskVerdictPartial;
  if (verdict === "not_done") return he.taskVerdictNotDone;
  return he.taskVerdictPending;
}
