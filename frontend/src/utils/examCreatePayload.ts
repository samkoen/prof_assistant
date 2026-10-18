import { he } from "../i18n/he";

export type ExamAudience = "all" | "this_group";
export type ExamKind = "official" | "tirgoul" | "task";

export interface ExamCreateForm {
  catalog_course_id: string;
  title: string;
  audience: ExamAudience;
  scope_academic_year: string;
  scope_semester: string;
  scope_group_name: string;
  is_tirgoul: boolean;
  kind: ExamKind;
}

export interface OfferingScope {
  id: number;
  academic_year: number;
  semester: number;
  group_name: string;
}

export interface ExamScopeValues {
  scope_teacher_id: number | null;
  scope_academic_year: number | null;
  scope_semester: number | null;
  scope_group_name: string | null;
}

export const EMPTY_EXAM_FORM: ExamCreateForm = {
  catalog_course_id: "",
  title: "",
  audience: "all",
  scope_academic_year: "",
  scope_semester: "",
  scope_group_name: "",
  is_tirgoul: true,
  kind: "tirgoul",
};

function numberOrNull(value: string): number | null {
  return value ? Number(value) : null;
}

/** Portée de l'examen : celle du groupe, aucune, ou la restriction saisie à la main. */
export function resolveScope(
  form: ExamCreateForm,
  offering: OfferingScope | null,
  userId: number | null,
): ExamScopeValues {
  const base = { scope_teacher_id: userId };
  if (offering && form.audience === "this_group") {
    return { ...base, scope_academic_year: offering.academic_year, scope_semester: offering.semester, scope_group_name: offering.group_name };
  }
  if (offering) {
    return { ...base, scope_academic_year: null, scope_semester: null, scope_group_name: null };
  }
  return {
    ...base,
    scope_academic_year: numberOrNull(form.scope_academic_year),
    scope_semester: numberOrNull(form.scope_semester),
    scope_group_name: form.scope_group_name.trim() || null,
  };
}

export function buildCreatePayload(form: ExamCreateForm, offering: OfferingScope | null, userId: number | null) {
  return {
    catalog_course_id: Number(form.catalog_course_id),
    offering_id: offering ? offering.id : null,
    title: form.title.trim() || he.newExamDefaultTitle,
    shuffle_questions: form.kind === "official",
    shuffle_options: form.kind !== "task",
    is_tirgoul: form.kind === "tirgoul",
    kind: form.kind,
    ...resolveScope(form, offering, userId),
  };
}

/** Ajoute le cours verrouillé par l'URL quand il n'est pas dans la liste de l'élève. */
export function ensureCatalogOption<T extends { id: number }>(catalogs: T[], catalogId: string, extra: T | null): T[] {
  if (!catalogId || catalogs.some((row) => String(row.id) === catalogId)) return catalogs;
  return extra ? [...catalogs, extra] : catalogs;
}

/** Tirgoul personnel : type forcé, sans restriction de groupe. */
export function forceTirgoulForm(form: ExamCreateForm): ExamCreateForm {
  return { ...form, kind: "tirgoul", is_tirgoul: true, audience: "all" };
}

/** Chemin de l'éditeur après création, en conservant la page de retour. */
export function editorPathAfterCreate(examId: number, returnTo: string, base = "/teacher/exams"): string {
  const suffix = returnTo !== base && returnTo !== "/teacher/exams" ? `?return=${encodeURIComponent(returnTo)}` : "";
  return `${base}/${examId}/edit${suffix}`;
}
