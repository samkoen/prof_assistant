const API_BASE = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    let detail = "אירעה שגיאה";
    try {
      const data = await res.json();
      detail = data.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(typeof detail === "string" ? detail : JSON.stringify(detail), res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type UserRole = "admin" | "teacher" | "student";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  student_id: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  is_blocked?: boolean;
}

/** Cours catalogue — contenu pédagogique réutilisable. */
export interface CatalogCourse {
  id: number;
  name: string;
  description: string | null;
  exam_count: number;
  exercise_count: number;
  created_at: string;
}

/** Instance de cours — prof + année + semestre + groupe. */
export interface CourseOffering {
  id: number;
  catalog_course_id: number;
  catalog_name: string;
  group_name: string;
  academic_year: number;
  semester: number;
  description: string | null;
  is_open_enrollment: boolean;
  auto_approve_enrollment: boolean;
  teacher_name: string;
  created_at: string;
  enrollment_status?: "pending" | "approved" | "rejected" | null;
}

export interface JoinPreview {
  offering_id: number;
  catalog_name: string;
  group_name: string;
  academic_year: number;
  semester: number;
  teacher_name: string;
  description: string | null;
  is_open_enrollment: boolean;
  auto_approve_enrollment: boolean;
  already_enrolled: boolean;
  enrollment_status: "pending" | "approved" | "rejected" | null;
}

export interface CatalogItemScope {
  created_by_id: number;
  created_by_name: string | null;
  scope_teacher_id: number | null;
  scope_teacher_name: string | null;
  scope_academic_year: number | null;
  scope_semester: number | null;
  scope_group_name: string | null;
}

export interface CatalogItemScopeInput {
  scope_teacher_id?: number | null;
  scope_academic_year?: number | null;
  scope_semester?: number | null;
  scope_group_name?: string | null;
}

export interface Exam extends CatalogItemScope {
  id: number;
  catalog_course_id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_detailed_correction: boolean;
  warning_minutes: number;
  auto_submit_on_timeout: boolean;
  default_multiple_scoring: string;
  question_count: number;
  can_delete?: boolean;
}

export interface ExamSession {
  id: number;
  exam_id: number;
  offering_id: number;
  exam_title: string;
  catalog_name: string;
  group_name: string;
  academic_year: number;
  semester: number;
  status: "draft" | "active" | "closed";
  activated_at: string | null;
  closed_at: string | null;
  results_published: boolean;
  integrity_mode_enabled: boolean;
  question_count: number;
}

export interface QuestionOption {
  id: number;
  text: string;
  is_correct: boolean | null;
  order_index: number;
}

export interface Question {
  id: number;
  text: string;
  question_type: "single" | "multiple" | "true_false";
  order_index: number;
  points: number;
  multiple_scoring_mode: string | null;
  options: QuestionOption[];
}

export interface ExamDetail extends Exam {
  questions: Question[];
  is_editable: boolean;
}

export interface StudentQuestionOption {
  id: number;
  text: string;
  order_index: number;
}

export interface StudentQuestion {
  id: number;
  text: string;
  question_type: "single" | "multiple" | "true_false";
  order_index: number;
  points: number;
  options: StudentQuestionOption[];
}

export interface ExamAttempt {
  id: number;
  exam_session_id: number;
  exam_id: number;
  started_at: string | null;
  expires_at: string | null;
  submitted_at: string | null;
  score: number | null;
  max_score: number | null;
  progress_index: number;
  can_resubmit: boolean;
  rules_accepted_at?: string | null;
  focus_loss_count?: number;
  total_hidden_seconds?: number;
}

export interface StudentExamResult {
  student_id: number;
  student_name: string;
  student_number: string | null;
  attempt_id: number | null;
  started_at: string | null;
  submitted_at: string | null;
  score: number | null;
  max_score: number | null;
  status: "not_started" | "in_progress" | "submitted";
  focus_loss_count?: number | null;
  total_hidden_seconds?: number | null;
}

export interface ExamSessionResults {
  session_id: number;
  exam_id: number;
  exam_title: string;
  offering_label: string;
  integrity_mode_enabled: boolean;
  results: StudentExamResult[];
}

export interface StudentOfferingExamResult {
  session_id: number;
  exam_id: number;
  exam_title: string;
  session_status: "draft" | "active" | "closed";
  attempt_id: number | null;
  started_at: string | null;
  submitted_at: string | null;
  score: number | null;
  max_score: number | null;
  status: "not_started" | "in_progress" | "submitted";
}

export interface StudentOfferingExamResults {
  student_id: number;
  student_name: string;
  student_number: string | null;
  offering_id: number;
  offering_label: string;
  results: StudentOfferingExamResult[];
}

export interface ExamTake {
  session_id: number;
  offering_id: number;
  exam_title: string;
  description: string | null;
  duration_minutes: number;
  warning_minutes: number;
  integrity_mode_enabled: boolean;
  attempt: ExamAttempt;
  questions: StudentQuestion[];
}

export interface Enrollment {
  id: number;
  offering_id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  catalog_name?: string | null;
  group_name?: string | null;
  academic_year?: number | null;
  semester?: number | null;
}

export interface StudentAccount {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  student_id: string | null;
  email_verified: boolean;
}

export function verifyStudentEmailBypass(studentId: number): Promise<{ ok: boolean }> {
  return api<{ ok: boolean }>(`/api/students/${studentId}/verify-email-bypass`, {
    method: "POST",
  });
}

export function semesterLabel(semester: number): string {
  if (semester === 1) return "סמסטר א";
  if (semester === 2) return "סמסטר ב";
  return `סמסטר ${semester}`;
}

export function offeringLabel(o: CourseOffering): string {
  return `${o.catalog_name} — ${o.group_name} (${o.academic_year}, ${semesterLabel(o.semester)})`;
}

export function enrollmentOfferingLabel(e: Enrollment): string | null {
  if (!e.catalog_name || !e.group_name || e.academic_year == null || e.semester == null) {
    return null;
  }
  return offeringLabel({
    id: e.offering_id,
    catalog_course_id: 0,
    catalog_name: e.catalog_name,
    group_name: e.group_name,
    academic_year: e.academic_year,
    semester: e.semester,
    description: null,
    is_open_enrollment: true,
    auto_approve_enrollment: false,
    teacher_name: "",
    created_at: "",
  });
}

export function examMatchesOffering(exam: CatalogItemScope, offering: CourseOffering): boolean {
  if (exam.scope_academic_year != null && exam.scope_academic_year !== offering.academic_year) return false;
  if (exam.scope_semester != null && exam.scope_semester !== offering.semester) return false;
  if (exam.scope_group_name != null && exam.scope_group_name !== offering.group_name) return false;
  return true;
}

export function formatScopeSummary(item: CatalogItemScope): string {
  const parts: string[] = [];
  if (item.scope_teacher_name) parts.push(item.scope_teacher_name);
  else if (item.scope_teacher_id) parts.push(`מורה #${item.scope_teacher_id}`);
  if (item.scope_academic_year) parts.push(String(item.scope_academic_year));
  if (item.scope_semester) parts.push(semesterLabel(item.scope_semester));
  if (item.scope_group_name) parts.push(item.scope_group_name);
  return parts.length ? parts.join(" · ") : "ללא הגבלה";
}
