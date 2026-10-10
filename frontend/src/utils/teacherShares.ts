import type { TeacherShare } from "../api/client";
import { he } from "../i18n/he";
import type { StatusTone } from "../theme/brand";

export function shareStatusView(status: TeacherShare["status"]): { label: string; tone: StatusTone } {
  if (status === "pending") return { label: he.shareStatusPending, tone: "warning" };
  if (status === "accepted") return { label: he.shareStatusAccepted, tone: "success" };
  return { label: he.shareStatusDeclined, tone: "neutral" };
}

/** Contenu partagé : cours catalogue (avec nombre d'examens) ou examen seul. */
export function shareSummary(row: Pick<TeacherShare, "share_type" | "source_catalog_name" | "source_exam_count" | "source_exam_title">): string {
  if (row.share_type === "catalog") {
    return `${row.source_catalog_name ?? ""} (${row.source_exam_count ?? 0} ${he.exams})`;
  }
  return row.source_exam_title ?? "";
}

/** Partages reçus à traiter, et partages envoyés triés du plus récent au plus ancien. */
export function splitShares(incoming: TeacherShare[], sent: TeacherShare[]) {
  const byDateDesc = (a: TeacherShare, b: TeacherShare) => Date.parse(b.created_at) - Date.parse(a.created_at);
  return {
    pendingIncoming: incoming.filter((s) => s.status === "pending").sort(byDateDesc),
    sentSorted: [...sent].sort(byDateDesc),
  };
}
