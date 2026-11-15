import { describe, expect, it } from "vitest";
import { he } from "../../i18n/he";
import { examPrimaryAction, primaryActionLabel, sessionPrimaryAction } from "../examPrimaryAction";

const none = { showStart: false, showStartBlocked: false, showClose: false, showDeactivate: false, canViewGrades: false };

describe("examPrimaryAction", () => {
  it("propose l'activation d'un brouillon prêt", () => {
    expect(examPrimaryAction({ ...none, showStart: true })).toBe("activate");
  });

  it("bloque l'activation sans questions", () => {
    expect(examPrimaryAction({ ...none, showStartBlocked: true })).toBe("activateBlocked");
  });

  it("propose la clôture d'un examen actif", () => {
    expect(examPrimaryAction({ ...none, showClose: true, showDeactivate: true, canViewGrades: true })).toBe("close");
  });

  it("propose la publication quand les remises sont fermées mais les notes non publiées", () => {
    expect(examPrimaryAction({ ...none, showClose: true, canViewGrades: true })).toBe("publish");
  });

  it("mène aux notes quand tout est publié", () => {
    expect(examPrimaryAction({ ...none, canViewGrades: true })).toBe("grades");
    expect(examPrimaryAction(none)).toBe("none");
  });
});

describe("sessionPrimaryAction", () => {
  const base = { status: "draft" as const, results_published: false, question_count: 3 };

  it("suit le cycle de vie d'une session", () => {
    expect(sessionPrimaryAction(base)).toBe("activate");
    expect(sessionPrimaryAction({ ...base, question_count: 0 })).toBe("activateBlocked");
    expect(sessionPrimaryAction({ ...base, status: "active" })).toBe("close");
    expect(sessionPrimaryAction({ ...base, status: "closed" })).toBe("publish");
    expect(sessionPrimaryAction({ ...base, status: "closed", results_published: true })).toBe("grades");
  });
});

describe("primaryActionLabel", () => {
  it("donne un libellé explicite à chaque action", () => {
    expect(primaryActionLabel("publish")).toBe(he.publishGrades);
    expect(primaryActionLabel("none")).toBe("");
  });
});
