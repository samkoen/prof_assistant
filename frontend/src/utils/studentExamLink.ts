import { studentCourseExamsPath } from "./studentCourseExamsNav";

export function buildStudentExamLink(offeringId: number, sessionId: number): string {
  const path = studentCourseExamsPath(offeringId, sessionId);
  return `${window.location.origin}${path}`;
}

export async function copyStudentExamLink(offeringId: number, sessionId: number): Promise<void> {
  await navigator.clipboard.writeText(buildStudentExamLink(offeringId, sessionId));
}
