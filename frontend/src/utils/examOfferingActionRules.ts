import type { Exam, ExamSession } from "../api/client";

export type ExamOfferingActionRules = {
  showClose: boolean;
  showDeactivate: boolean;
  showReopen: boolean;
  showStart: boolean;
  showStartBlocked: boolean;
  canViewGrades: boolean;
  canDelete: boolean;
  gradesPath: string;
  showStudentLink: boolean;
};

export function getExamOfferingActionRules(
  exam: Exam,
  session: ExamSession | undefined,
  courseId: number | undefined,
  hasQuestions: boolean,
  activatingId: number | null = null,
): ExamOfferingActionRules {
  const isActive = session?.status === "active";
  const canStart = !session || session.status === "draft";
  const canViewGrades = !!session && session.status !== "draft";
  const showClose =
    !!session &&
    (session.status === "active" || (session.status === "closed" && !session.results_published));
  const showDeactivate = isActive && !!session;
  const showReopen = session?.status === "closed";
  const showStart = (canStart && hasQuestions) || activatingId === exam.id;
  const showStartBlocked = canStart && !hasQuestions && activatingId !== exam.id;
  const gradesPath =
    session && courseId
      ? `/teacher/courses/${courseId}/exams/sessions/${session.id}/results`
      : "";

  return {
    showClose,
    showDeactivate,
    showReopen,
    showStart,
    showStartBlocked,
    canViewGrades,
    canDelete: exam.can_delete !== false,
    gradesPath,
    showStudentLink: session?.status === "active" && !!courseId && courseId > 0,
  };
}

export function parseOfferingIdFromReturn(returnTo: string): number | null {
  const match = returnTo.match(/\/teacher\/courses\/(\d+)\/exams/);
  return match ? Number(match[1]) : null;
}
