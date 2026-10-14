import { describe, expect, it } from "vitest";
import { he } from "../../i18n/he";
import {
  EMPTY_EXAM_FORM,
  buildCreatePayload,
  editorPathAfterCreate,
  forceTirgoulForm,
  resolveScope,
  type ExamCreateForm,
} from "../examCreatePayload";

const offering = { id: 7, academic_year: 2026, semester: 2, group_name: "ב" };
const form = (patch: Partial<ExamCreateForm> = {}): ExamCreateForm => ({
  ...EMPTY_EXAM_FORM,
  catalog_course_id: "3",
  ...patch,
});

describe("resolveScope", () => {
  it("reprend la portée du groupe quand l'examen est réservé à ce groupe", () => {
    expect(resolveScope(form({ audience: "this_group" }), offering, 5)).toEqual({
      scope_teacher_id: 5,
      scope_academic_year: 2026,
      scope_semester: 2,
      scope_group_name: "ב",
    });
  });

  it("n'impose aucune restriction pour tous les groupes", () => {
    const scope = resolveScope(form({ audience: "all", scope_group_name: "x" }), offering, 5);
    expect(scope).toEqual({ scope_teacher_id: 5, scope_academic_year: null, scope_semester: null, scope_group_name: null });
  });

  it("utilise la restriction saisie hors contexte de groupe", () => {
    const scope = resolveScope(form({ scope_academic_year: "2025", scope_semester: "1", scope_group_name: " א " }), null, null);
    expect(scope).toEqual({ scope_teacher_id: null, scope_academic_year: 2025, scope_semester: 1, scope_group_name: "א" });
  });
});

describe("EMPTY_EXAM_FORM", () => {
  it("par défaut : exercice (תרגול) pour tous les groupes", () => {
    expect(EMPTY_EXAM_FORM.is_tirgoul).toBe(true);
    expect(EMPTY_EXAM_FORM.audience).toBe("all");
  });
});

describe("buildCreatePayload", () => {
  it("applique un titre par défaut et mélange les questions pour un vrai examen", () => {
    const payload = buildCreatePayload(form({ title: "  ", is_tirgoul: false }), null, 1);
    expect(payload.title).toBe(he.newExamDefaultTitle);
    expect(payload.shuffle_questions).toBe(true);
    expect(payload.offering_id).toBeNull();
    expect(payload.catalog_course_id).toBe(3);
  });

  it("garde l'ordre des questions d'un exercice mais mélange toujours les options", () => {
    const payload = buildCreatePayload(form({ is_tirgoul: true, title: "תרגיל" }), offering, 1);
    expect(payload).toMatchObject({ shuffle_questions: false, shuffle_options: true, is_tirgoul: true, offering_id: 7 });
  });

  it("force un tirgoul personnel même si le formulaire disait examen", () => {
    const payload = buildCreatePayload(forceTirgoulForm(form({ is_tirgoul: false, audience: "this_group" })), offering, 1);
    expect(payload.is_tirgoul).toBe(true);
    expect(payload.shuffle_questions).toBe(false);
    expect(payload.scope_group_name).toBeNull();
  });
});

describe("editorPathAfterCreate", () => {
  it("n'ajoute pas de paramètre pour la liste des examens", () => {
    expect(editorPathAfterCreate(9, "/teacher/exams")).toBe("/teacher/exams/9/edit");
  });

  it("ouvre l'éditeur élève en conservant le retour", () => {
    expect(editorPathAfterCreate(4, "/student/courses/2", "/student/tirgoulim")).toBe(
      "/student/tirgoulim/4/edit?return=%2Fstudent%2Fcourses%2F2",
    );
  });

  it("conserve la page de retour encodée", () => {
    expect(editorPathAfterCreate(9, "/teacher/courses/4/exams")).toBe(
      "/teacher/exams/9/edit?return=%2Fteacher%2Fcourses%2F4%2Fexams",
    );
  });
});
