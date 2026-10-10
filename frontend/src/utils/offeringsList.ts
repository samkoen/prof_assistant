import type { CourseOffering, Enrollment } from "../api/client";
import { matchesQuery } from "./examFilters";

export type SemesterFilter = "all" | "1" | "2";

/** Filtre par texte (cours, groupe, année, description) et par semestre. */
export function filterOfferings(offerings: CourseOffering[], query: string, semester: SemesterFilter): CourseOffering[] {
  return offerings.filter(
    (o) =>
      (semester === "all" || String(o.semester) === semester) &&
      matchesQuery([o.catalog_name, o.group_name, o.academic_year, o.description], query),
  );
}

/** Plus récent d'abord (année, semestre), puis ordre alphabétique du cours et du groupe. */
export function sortOfferings(offerings: CourseOffering[]): CourseOffering[] {
  return [...offerings].sort(
    (a, b) =>
      b.academic_year - a.academic_year ||
      b.semester - a.semester ||
      a.catalog_name.localeCompare(b.catalog_name, "he") ||
      a.group_name.localeCompare(b.group_name, "he"),
  );
}

/** Nombre de demandes d'inscription en attente, par groupe (offering_id). */
export function countPendingByOffering(rows: Pick<Enrollment, "offering_id">[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const row of rows) counts[row.offering_id] = (counts[row.offering_id] ?? 0) + 1;
  return counts;
}
