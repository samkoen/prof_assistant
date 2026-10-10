import type { Enrollment } from "../api/client";
import { he } from "../i18n/he";
import type { StatusTone } from "../theme/brand";

export type EnrollmentStatus = Enrollment["status"];

export function enrollmentStatusView(status: EnrollmentStatus): { label: string; tone: StatusTone } {
  if (status === "approved") return { label: he.enrollmentStatusApproved, tone: "success" };
  if (status === "pending") return { label: he.pending, tone: "warning" };
  return { label: he.enrollmentStatusRejected, tone: "danger" };
}

export function countByStatus(rows: Pick<Enrollment, "status">[]): Record<EnrollmentStatus, number> {
  const counts: Record<EnrollmentStatus, number> = { approved: 0, pending: 0, rejected: 0 };
  for (const row of rows) counts[row.status] += 1;
  return counts;
}

/** Étudiants du système pas encore approuvés dans ce groupe (candidats à l'ajout). */
export function addableStudents<T extends { id: number }>(all: T[], enrollments: Pick<Enrollment, "student_id" | "status">[]): T[] {
  const approved = new Set(enrollments.filter((e) => e.status === "approved").map((e) => e.student_id));
  return all.filter((student) => !approved.has(student.id));
}
