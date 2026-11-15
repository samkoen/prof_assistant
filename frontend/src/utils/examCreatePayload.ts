import { he } from "../i18n/he";
import { START_PARAM, type QuestionAddMethod } from "./examStartMethod";

export type ExamKind = "official" | "tirgoul" | "task";

/**
 * Formulaire de création : seulement ce qui est nécessaire pour démarrer.
 * La portée (année / semestre / groupe) se règle ensuite dans les réglages de l'éditeur.
 */
export interface ExamCreateForm {
  catalog_course_id: string;
  title: string;
  is_tirgoul: boolean;
  kind: ExamKind;
  start: QuestionAddMethod;
}

export const EMPTY_EXAM_FORM: ExamCreateForm = {
  catalog_course_id: "",
  title: "",
  is_tirgoul: true,
  kind: "tirgoul",
  start: "gemini",
};

export function buildCreatePayload(form: ExamCreateForm, offering: { id: number } | null, userId: number | null) {
  return {
    catalog_course_id: Number(form.catalog_course_id),
    offering_id: offering ? offering.id : null,
    title: form.title.trim() || he.newExamDefaultTitle,
    shuffle_questions: form.kind === "official",
    shuffle_options: form.kind !== "task",
    is_tirgoul: form.kind === "tirgoul",
    kind: form.kind,
    scope_teacher_id: userId,
    scope_academic_year: null,
    scope_semester: null,
    scope_group_name: null,
  };
}

/** Ajoute le cours verrouillé par l'URL quand il n'est pas dans la liste de l'élève. */
export function ensureCatalogOption<T extends { id: number }>(catalogs: T[], catalogId: string, extra: T | null): T[] {
  if (!catalogId || catalogs.some((row) => String(row.id) === catalogId)) return catalogs;
  return extra ? [...catalogs, extra] : catalogs;
}

/** Tirgoul personnel : type forcé. */
export function forceTirgoulForm(form: ExamCreateForm): ExamCreateForm {
  return { ...form, kind: "tirgoul", is_tirgoul: true };
}

/** Chemin de l'éditeur après création : page de retour conservée, méthode de départ transmise. */
export function editorPathAfterCreate(
  examId: number,
  returnTo: string,
  base = "/teacher/exams",
  start: QuestionAddMethod | null = null,
): string {
  const query = new URLSearchParams();
  if (returnTo !== base && returnTo !== "/teacher/exams") query.set("return", returnTo);
  if (start) query.set(START_PARAM, start);
  const qs = query.toString();
  return `${base}/${examId}/edit${qs ? `?${qs}` : ""}`;
}
