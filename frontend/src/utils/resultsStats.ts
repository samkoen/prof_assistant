import type { StudentExamResult } from "../api/client";
import { matchesQuery } from "./examFilters";
import type { StatusTone } from "../theme/brand";

export type ResultStatus = StudentExamResult["status"];
export type ResultsStatusFilter = "all" | ResultStatus;
export type ResultsSortKey = "name" | "score" | "submitted";
export type SortDirection = "asc" | "desc";

export interface ResultsStats {
  total: number;
  submitted: number;
  inProgress: number;
  notStarted: number;
  /** Nombre de copies avec une note exploitable. */
  graded: number;
  average: number | null;
  highest: number | null;
  lowest: number | null;
}

export interface DistributionBucket {
  from: number;
  to: number;
  count: number;
}

/** Note en pourcentage (0-100), ou null si la copie n'est pas notée. */
export function percentOf(row: Pick<StudentExamResult, "score" | "max_score">): number | null {
  if (row.score == null || row.max_score == null || row.max_score <= 0) return null;
  return (row.score / row.max_score) * 100;
}

function gradedPercents(results: StudentExamResult[]): number[] {
  return results.filter((r) => r.status === "submitted").flatMap((r) => percentOf(r) ?? []);
}

export function computeResultsStats(results: StudentExamResult[]): ResultsStats {
  const count = (status: ResultStatus) => results.filter((r) => r.status === status).length;
  const percents = gradedPercents(results);
  const sum = percents.reduce((acc, value) => acc + value, 0);
  return {
    total: results.length,
    submitted: count("submitted"),
    inProgress: count("in_progress"),
    notStarted: count("not_started"),
    graded: percents.length,
    average: percents.length ? sum / percents.length : null,
    highest: percents.length ? Math.max(...percents) : null,
    lowest: percents.length ? Math.min(...percents) : null,
  };
}

/** Répartition des notes par tranches de 10 % ; 100 % est compté dans la dernière tranche. */
export function scoreDistribution(results: StudentExamResult[]): DistributionBucket[] {
  const buckets: DistributionBucket[] = Array.from({ length: 10 }, (_, i) => ({ from: i * 10, to: i * 10 + 10, count: 0 }));
  for (const percent of gradedPercents(results)) {
    buckets[Math.min(9, Math.floor(percent / 10))].count += 1;
  }
  return buckets;
}

export function formatPercent(value: number | null): string {
  return value == null ? "—" : `${Math.round(value)}%`;
}

/** Couleur d'une note : rouge sous 55 %, ambre sous 75 %, vert au-delà. */
export function scoreTone(percent: number | null): StatusTone {
  if (percent == null) return "neutral";
  if (percent < 55) return "danger";
  return percent < 75 ? "warning" : "success";
}

export function filterResults(
  rows: StudentExamResult[],
  query: string,
  status: ResultsStatusFilter,
): StudentExamResult[] {
  return rows.filter(
    (row) => (status === "all" || row.status === status) && matchesQuery([row.student_name, row.student_number], query),
  );
}

function compareBy(key: ResultsSortKey, a: StudentExamResult, b: StudentExamResult): number {
  if (key === "name") return a.student_name.localeCompare(b.student_name, "he");
  if (key === "score") return (percentOf(a) ?? -1) - (percentOf(b) ?? -1);
  return Date.parse(a.submitted_at ?? "") - Date.parse(b.submitted_at ?? "") || 0;
}

/** Tri stable ; les valeurs manquantes (non noté, non remis) passent toujours en dernier. */
export function sortResults(rows: StudentExamResult[], key: ResultsSortKey, direction: SortDirection): StudentExamResult[] {
  const missing = (r: StudentExamResult) => (key === "score" ? percentOf(r) == null : key === "submitted" ? !r.submitted_at : false);
  const sign = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (missing(a) !== missing(b)) return missing(a) ? 1 : -1;
    return sign * compareBy(key, a, b);
  });
}
