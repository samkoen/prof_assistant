import { api, ApiError } from "./client";

export interface MoodleConnectionStatus {
  connected: boolean;
  base_url: string | null;
  moodle_user_id: number | null;
}

export interface MoodleCourseItem {
  id: number;
  shortname: string;
  fullname: string;
  offering_id: number | null;
}

export interface MoodleImportCourseResult {
  offering_id: number;
  moodle_course_id: number;
  created: boolean;
}

export interface MoodleUnknownStudent {
  email: string;
  fullname: string;
}

export interface MoodleSkippedStudent extends MoodleUnknownStudent {
  reason: string;
}

export interface MoodleStudentImportResult {
  enrolled: number;
  already: number;
  unknown: MoodleUnknownStudent[];
  skipped: MoodleSkippedStudent[];
}

export interface MoodleAssignmentItem {
  id: number;
  name: string;
  grade_max: number;
}

export interface MoodleAssignmentsView {
  linked: boolean;
  moodle_course_id: number | null;
  assignments: MoodleAssignmentItem[];
  selected_assign_id: number | null;
}

export interface MoodleGradeSkip {
  student_name: string;
  reason: string;
}

export interface MoodleGradePushResult {
  sent: number;
  skipped: MoodleGradeSkip[];
}

export function moodleError(err: unknown): string {
  return err instanceof ApiError ? err.message : "אירעה שגיאה";
}

export function fetchMoodleConnection() {
  return api<MoodleConnectionStatus>("/api/moodle/connection");
}

export function saveMoodleConnection(baseUrl: string, token: string) {
  return api<MoodleConnectionStatus>("/api/moodle/connection", {
    method: "PUT",
    body: JSON.stringify({ base_url: baseUrl, token }),
  });
}

export function fetchMoodleCourses() {
  return api<MoodleCourseItem[]>("/api/moodle/courses");
}

export function importMoodleCourse(moodleCourseId: number, offeringId?: number) {
  return api<MoodleImportCourseResult>("/api/moodle/courses/import", {
    method: "POST",
    body: JSON.stringify({
      moodle_course_id: moodleCourseId,
      offering_id: offeringId ?? null,
    }),
  });
}

export function importMoodleStudents(offeringId: number) {
  return api<MoodleStudentImportResult>(`/api/moodle/offerings/${offeringId}/students`, {
    method: "POST",
  });
}

export function fetchMoodleAssignments(sessionId: number) {
  return api<MoodleAssignmentsView>(`/api/moodle/sessions/${sessionId}/assignments`);
}

export function selectMoodleAssignment(sessionId: number, assignId: number) {
  return api<MoodleAssignmentsView>(`/api/moodle/sessions/${sessionId}/assignment`, {
    method: "PUT",
    body: JSON.stringify({ moodle_assign_id: assignId }),
  });
}

export function pushMoodleGrades(sessionId: number) {
  return api<MoodleGradePushResult>(`/api/moodle/sessions/${sessionId}/grades`, {
    method: "POST",
  });
}
