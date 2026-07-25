import { describe, expect, it } from "vitest";
import type { Exam, ExamSession } from "../../api/client";
import {
  getExamOfferingActionRules,
  parseOfferingIdFromReturn,
} from "../examOfferingActionRules";

const exam = { id: 5, can_delete: true } as Exam;

describe("examOfferingActionRules", () => {
  it("draft sans questions : start bloqué", () => {
    const rules = getExamOfferingActionRules(
      exam,
      { status: "draft" } as ExamSession,
      3,
      false,
    );
    expect(rules.showStart).toBe(false);
    expect(rules.showStartBlocked).toBe(true);
    expect(rules.canViewGrades).toBe(false);
  });

  it("session active : close, deactivate, lien élève", () => {
    const rules = getExamOfferingActionRules(
      exam,
      { id: 9, status: "active" } as ExamSession,
      3,
      true,
    );
    expect(rules.showClose).toBe(true);
    expect(rules.showDeactivate).toBe(true);
    expect(rules.showStudentLink).toBe(true);
    expect(rules.gradesPath).toContain("/sessions/9/results");
  });

  it("parse l'offering depuis returnTo", () => {
    expect(parseOfferingIdFromReturn("/teacher/courses/42/exams")).toBe(42);
    expect(parseOfferingIdFromReturn("/elsewhere")).toBeNull();
  });
});
