import { enrollmentOfferingLabel, type Enrollment } from "../api/client";
import { he } from "../i18n/he";
import { matchesQuery } from "./examFilters";

export interface EnrollmentGroup {
  offeringId: number;
  label: string;
  rows: Enrollment[];
}

/** Demandes en attente regroupées par groupe de cours, après filtre texte (étudiant, e-mail, cours). */
export function groupEnrollments(rows: Enrollment[], query: string): EnrollmentGroup[] {
  const groups = new Map<number, EnrollmentGroup>();
  for (const row of rows) {
    const label = enrollmentOfferingLabel(row) ?? he.enrollmentNoCourse;
    if (!matchesQuery([row.student_name, row.student_email, label], query)) continue;
    const group = groups.get(row.offering_id) ?? { offeringId: row.offering_id, label, rows: [] };
    group.rows.push(row);
    groups.set(row.offering_id, group);
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label, "he"));
}
