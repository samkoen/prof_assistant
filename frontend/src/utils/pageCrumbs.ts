import { he } from "../i18n/he";

export interface Crumb {
  label: string;
  /** Absent sur la page courante (non cliquable). */
  path?: string;
}

const PATH_LABELS: Record<string, string> = {
  "/teacher": he.dashboard,
  "/teacher/students": he.students,
  "/teacher/courses": he.myCourses,
  "/teacher/courses/:id/students": he.students,
  "/teacher/courses/:id/exams": he.exams,
  "/teacher/courses/:id/exams/sessions/:id/results": he.examResults,
  "/teacher/enrollments": he.pendingApprovals,
  "/teacher/shares": he.teacherShares,
  "/teacher/catalog-courses": he.catalogCourses,
  "/teacher/exams": he.exams,
  "/teacher/exams/new": he.createExam,
  "/teacher/exams/:id/edit": he.editExam,
  "/student": he.dashboard,
  "/student/courses": he.myCourses,
  "/student/courses/:id": he.exams,
  "/student/exams": he.exams,
  "/student/join-course": he.joinByTeacherTitle,
  "/student/notifications": he.notifications,
  "/admin": he.dashboard,
  "/admin/users": he.adminUsers,
  "/admin/students": he.students,
  "/admin/courses": he.allCourses,
  "/admin/ai-explanations": he.aiExplanationsAdminTitle,
  "/admin/ai-prompts": he.aiPromptsAdminTitle,
  "/admin/ai-billing": he.aiBillingAdminTitle,
  "/profile": he.myProfile,
  "/billing/return": he.aiCreditsBuyTitle,
};

function normalized(path: string): string {
  return path.replace(/\/\d+(?=\/|$)/g, "/:id");
}

function prefixesOf(pathname: string): string[] {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((_, index) => "/" + parts.slice(0, index + 1).join("/"));
}

function labelledTrail(pathname: string): Crumb[] {
  const trail: Crumb[] = [];
  for (const prefix of prefixesOf(pathname)) {
    const label = PATH_LABELS[normalized(prefix)];
    if (label) trail.push({ label, path: prefix });
  }
  return trail;
}

/** Fil d'Ariane de la page courante ; le premier maillon est l'accueil du rôle. */
export function crumbsFor(pathname: string, homePath: string): Crumb[] {
  const trail = labelledTrail(pathname);
  const startsAtHome = trail[0]?.path === homePath;
  const full = startsAtHome ? trail : [{ label: he.dashboard, path: homePath }, ...trail];
  return full.map((crumb, index) =>
    index === full.length - 1 ? { label: crumb.label } : crumb,
  );
}
