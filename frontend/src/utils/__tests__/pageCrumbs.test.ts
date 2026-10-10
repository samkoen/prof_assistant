import { describe, expect, it } from "vitest";
import { he } from "../../i18n/he";
import { crumbsFor } from "../pageCrumbs";

describe("crumbsFor", () => {
  it("affiche un seul maillon sur l'accueil du rôle", () => {
    expect(crumbsFor("/teacher", "/teacher")).toEqual([{ label: he.dashboard }]);
  });

  it("ajoute l'accueil devant une page de premier niveau", () => {
    expect(crumbsFor("/teacher/exams", "/teacher")).toEqual([
      { label: he.dashboard, path: "/teacher" },
      { label: he.exams },
    ]);
  });

  it("ignore les identifiants numériques et garde les liens réels", () => {
    const crumbs = crumbsFor("/teacher/exams/12/edit", "/teacher");
    expect(crumbs.map((c) => c.label)).toEqual([he.dashboard, he.exams, he.editExam]);
    expect(crumbs[1].path).toBe("/teacher/exams");
    expect(crumbs[2].path).toBeUndefined();
  });

  it("construit la chaîne des résultats d'une session", () => {
    const crumbs = crumbsFor("/teacher/courses/9/exams/sessions/4/results", "/teacher");
    expect(crumbs.map((c) => c.label)).toEqual([he.dashboard, he.myCourses, he.exams, he.examResults]);
    expect(crumbs[2].path).toBe("/teacher/courses/9/exams");
  });

  it("rattache le profil à l'accueil du rôle", () => {
    expect(crumbsFor("/profile", "/student")).toEqual([
      { label: he.dashboard, path: "/student" },
      { label: he.myProfile },
    ]);
  });
});
