import { describe, expect, it } from "vitest";
import { isMenuItemSelected } from "../menuSelection";

describe("isMenuItemSelected", () => {
  it("active l'élément sur sa page exacte", () => {
    expect(isMenuItemSelected({ path: "/teacher/exams" }, "/teacher/exams")).toBe(true);
  });

  it("garde l'élément actif sur ses sous-pages", () => {
    expect(isMenuItemSelected({ path: "/teacher/exams" }, "/teacher/exams/12/edit")).toBe(true);
  });

  it("n'active pas l'accueil du rôle sur les autres pages", () => {
    expect(isMenuItemSelected({ path: "/teacher" }, "/teacher/exams")).toBe(false);
    expect(isMenuItemSelected({ path: "/teacher" }, "/teacher")).toBe(true);
  });

  it("n'est pas trompé par un préfixe de nom proche", () => {
    expect(isMenuItemSelected({ path: "/teacher/exam" }, "/teacher/exams")).toBe(false);
  });

  it("respecte matchPathPrefix quand il est défini", () => {
    const item = { path: "/student/courses", matchPathPrefix: "/student/courses" };
    expect(isMenuItemSelected(item, "/student/courses/3")).toBe(true);
  });
});
