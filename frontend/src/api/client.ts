const API_BASE = import.meta.env.VITE_API_URL ?? "";

export function resolveApiUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}

export async function uploadQuestionImage(examId: number, file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/exams/${examId}/question-images`, {
    method: "POST",
    credentials: "include",
    body: form,
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
  const data = (await res.json()) as { url: string };
  return data.url;
}

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

function buildPdfFilename(title: string | undefined, examId: number): string {
  let base = (title ?? "").trim() || `exam_${examId}`;
  base = base.replace(/[\r\n"/\\?*:|<>]/g, "").slice(0, 120);
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
}

function filenameFromContentDisposition(
  header: string,
  fallbackTitle: string | undefined,
  examId: number,
): string {
  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      /* ignore */
    }
  }
  const quoted = header.match(/filename="([^"]+)"/i);
  if (quoted?.[1]) {
    const generic = quoted[1] === `exam_${examId}.pdf`;
    if (!generic || !fallbackTitle?.trim()) return quoted[1];
  }
  return buildPdfFilename(fallbackTitle, examId);
}

export async function downloadExamPdf(examId: number, title?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/exams/${examId}/pdf`, {
    credentials: "include",
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
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const filename = disposition
    ? filenameFromContentDisposition(disposition, title, examId)
    : buildPdfFilename(title, examId);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export type UserRole = "admin" | "teacher" | "student";
export type ExplanationLanguage = "he" | "fr" | "en" | "ru";

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
  ai_explanation_language?: ExplanationLanguage;
}

/** Cours catalogue — contenu pédagogique réutilisable. */
export type TeacherShareType = "exam" | "catalog";
export type TeacherShareStatus = "pending" | "accepted" | "declined";

export interface TeacherShare {
  id: number;
  share_type: TeacherShareType;
  status: TeacherShareStatus;
  sender_id: number;
  sender_name: string;
  recipient_id: number;
  recipient_name: string;
  source_exam_id: number | null;
  source_exam_title: string | null;
  source_catalog_id: number | null;
  source_catalog_name: string | null;
  source_exam_count: number | null;
  target_catalog_id: number | null;
  target_catalog_name: string | null;
  message: string | null;
  created_at: string;
  resolved_at: string | null;
  suggested_catalog_id: number | null;
}

export interface CatalogCourse {
  id: number;
  name: string;
  description: string | null;
  teacher_id: number;
  teacher_name: string;
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
  join_token?: string | null;
  join_token_expires_at?: string | null;
}

export interface TeacherOpenOfferings {
  teacher_id: number;
  teacher_name: string;
  teacher_email: string;
  offerings: CourseOffering[];
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
  join_link_expired: boolean;
  join_token_expires_at: string | null;
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
  questions_language: "he" | "fr" | "en" | "ru";
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
  image_url?: string | null;
}

export interface Question {
  id: number;
  text: string;
  image_url?: string | null;
  question_type: "single" | "multiple" | "true_false";
  order_index: number;
  points: number;
  multiple_scoring_mode: string | null;
  options: QuestionOption[];
}

export interface ExamDetail extends Exam {
  catalog_course_name?: string;
  questions: Question[];
  is_editable: boolean;
}

export interface StudentQuestionOption {
  id: number;
  text: string;
  order_index: number;
  image_url?: string | null;
}

export interface StudentQuestion {
  id: number;
  text: string;
  image_url?: string | null;
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
  practice_active?: boolean;
  practice_score?: number | null;
  practice_max_score?: number | null;
  practice_submitted_at?: string | null;
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
  auto_submit_on_timeout: boolean;
  integrity_mode_enabled: boolean;
  questions_language?: "he" | "fr" | "en" | "ru";
  attempt: ExamAttempt;
  questions: StudentQuestion[];
  saved_answers?: { question_id: number; selected_option_ids: number[] }[];
}

export interface ExamReviewCorrectOption {
  text: string;
  image_url?: string | null;
}

export interface ExamReviewQuestion {
  id: number;
  text: string;
  image_url?: string | null;
  question_type: "single" | "multiple" | "true_false";
  order_index: number;
  points: number;
  is_correct: boolean;
  correct_options: ExamReviewCorrectOption[];
  student_options: ExamReviewCorrectOption[];
}

export interface ExamReview {
  session_id: number;
  exam_title: string;
  show_correction: boolean;
  questions_language?: "he" | "fr" | "en" | "ru";
  attempt: ExamAttempt;
  questions: ExamReviewQuestion[];
  for_practice?: boolean;
}

export interface PracticeResult {
  id: number;
  score: number;
  max_score: number;
  submitted_at: string;
}

export interface StudentExamSessionWithAttempt extends ExamSession {
  attempt: ExamAttempt | null;
}

export interface StudentOfferingExamsBoard {
  offering: CourseOffering;
  sessions: StudentExamSessionWithAttempt[];
}

export interface AiExplanation {
  question_id: number;
  explanation: string;
  from_cache?: boolean;
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

export interface AiExplanationCacheStats {
  total_rows: number;
  distinct_students: number;
  distinct_attempts: number;
}

export interface AiExplanationCleanupResult {
  deleted_rows: number;
}

export interface StudentAccount {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  student_id: string | null;
  email_verified: boolean;
  ai_explanation_language?: ExplanationLanguage;
}

export interface UserProfileUpdatePayload {
  full_name?: string;
  email?: string;
  phone?: string | null;
  student_id?: string | null;
  current_password?: string;
  new_password?: string;
}

export interface UserProfileUpdateResult {
  user: User;
  email_verification_sent: boolean;
}

export function updateMyProfile(payload: UserProfileUpdatePayload): Promise<UserProfileUpdateResult> {
  return api<UserProfileUpdateResult>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateAiExplanationLanguage(language: ExplanationLanguage): Promise<User> {
  return api<User>("/api/auth/me/ai-explanation-language", {
    method: "PATCH",
    body: JSON.stringify({ language }),
  });
}

export function verifyStudentEmailBypass(studentId: number): Promise<{ ok: boolean }> {
  return api<{ ok: boolean }>(`/api/students/${studentId}/verify-email-bypass`, {
    method: "POST",
  });
}

export function deleteStudent(studentId: number): Promise<void> {
  return api<void>(`/api/students/${studentId}`, { method: "DELETE" });
}

export function fetchAiExplanationCacheStats(): Promise<AiExplanationCacheStats> {
  return api<AiExplanationCacheStats>("/api/admin/ai-explanations/stats");
}

export function cleanupAiExplanations(olderThanDays?: number): Promise<AiExplanationCleanupResult> {
  const query = olderThanDays ? `?older_than_days=${olderThanDays}` : "";
  return api<AiExplanationCleanupResult>(`/api/admin/ai-explanations${query}`, {
    method: "DELETE",
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
