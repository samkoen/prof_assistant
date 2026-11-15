import { describe, expect, it } from "vitest";
import { he } from "../../i18n/he";
import {
  EMPTY_EXAM_FORM,
  buildCreatePayload,
  editorPathAfterCreate,
  ensureCatalogOption,
  forceTirgoulForm,
  type ExamCreateForm,
} from "../examCreatePayload";

const offering = { id: 7, academic_year: 2026, semester: 2, group_name: "ב" };
const form = (patch: Partial<ExamCreateForm> = {}): ExamCreateForm => ({
  ...EMPTY_EXAM_FORM,
  catalog_course_id: "3",
  ...patch,
});

describe("portée à la création", () => {
  it("aucune restriction : la portée se règle ensuite dans l'éditeur", () => {
    const payload = buildCreatePayload(form(), offering, 5);
    expect(payload).toMatchObject({ scope_teacher_id: 5, scope_academic_year: null, scope_semester: null, scope_group_name: null });
  });
});

describe("EMPTY_EXAM_FORM", () => {
  it("par défaut : exercice (תרגול), démarrage avec l'AI", () => {
    expect(EMPTY_EXAM_FORM.is_tirgoul).toBe(true);
    expect(EMPTY_EXAM_FORM.start).toBe("gemini");
  });
});

describe("buildCreatePayload", () => {
  it("applique un titre par défaut et mélange les questions pour un vrai examen", () => {
    const payload = buildCreatePayload(form({ title: "  ", kind: "official", is_tirgoul: false }), null, 1);
    expect(payload.title).toBe(he.newExamDefaultTitle);
    expect(payload.shuffle_questions).toBe(true);
    expect(payload.offering_id).toBeNull();
    expect(payload.catalog_course_id).toBe(3);
  });

  it("crée une tâche sans mélange et sans flag tirgoul", () => {
    const payload = buildCreatePayload(form({ kind: "task", title: "משימה" }), offering, 1);
    expect(payload).toMatchObject({ kind: "task", is_tirgoul: false, shuffle_questions: false, shuffle_options: false });
  });

  it("garde l'ordre des questions d'un exercice mais mélange toujours les options", () => {
    const payload = buildCreatePayload(form({ is_tirgoul: true, title: "תרגיל" }), offering, 1);
    expect(payload).toMatchObject({ shuffle_questions: false, shuffle_options: true, is_tirgoul: true, kind: "tirgoul", offering_id: 7 });
  });

  it("force un tirgoul personnel même si le formulaire disait examen", () => {
    const payload = buildCreatePayload(forceTirgoulForm(form({ is_tirgoul: false, kind: "official" })), offering, 1);
    expect(payload.is_tirgoul).toBe(true);
    expect(payload.kind).toBe("tirgoul");
    expect(payload.shuffle_questions).toBe(false);
    expect(payload.scope_group_name).toBeNull();
  });
});

describe("ensureCatalogOption", () => {
  it("ajoute le cours verrouillé absent de la liste", () => {
    const extra = { id: 4, name: "מתמטיקה" };
    const other = { id: 1, name: "אחר" };
    const same = { id: 4, name: "ישן" };
    expect(ensureCatalogOption([other], "4", extra)).toEqual([other, extra]);
    expect(ensureCatalogOption([same], "4", extra)).toEqual([same]);
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

  it("transmet la méthode de départ choisie", () => {
    expect(editorPathAfterCreate(9, "/teacher/exams", "/teacher/exams", "paste")).toBe("/teacher/exams/9/edit?start=paste");
    expect(editorPathAfterCreate(9, "/teacher/courses/4/exams", "/teacher/exams", "gemini")).toBe(
      "/teacher/exams/9/edit?return=%2Fteacher%2Fcourses%2F4%2Fexams&start=gemini",
    );
  });
});
