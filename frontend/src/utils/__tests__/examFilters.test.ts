import { describe, expect, it } from "vitest";
import type { ExamSession } from "../../api/client";
import {
  NO_FILTERS,
  catalogNames,
  filterSessions,
  filterTemplates,
  hasActiveFilters,
  matchesQuery,
} from "../examFilters";

function session(patch: Partial<ExamSession>): ExamSession {
  return {
    id: 1,
    exam_id: 1,
    offering_id: 1,
    exam_title: "אלגברה",
    catalog_name: "מתמטיקה",
    group_name: "קבוצה א",
    academic_year: 2026,
    semester: 1,
    status: "active",
    activated_at: null,
    closed_at: null,
    results_published: false,
    integrity_mode_enabled: false,
    question_count: 5,
    ...patch,
  };
}

describe("matchesQuery", () => {
  it("accepte tout quand la recherche est vide", () => {
    expect(matchesQuery(["abc"], "   ")).toBe(true);
  });

  it("exige tous les mots, dans n'importe quel champ", () => {
    expect(matchesQuery(["אלגברה", "מתמטיקה"], "אלג מתמ")).toBe(true);
    expect(matchesQuery(["אלגברה", "מתמטיקה"], "אלג פיזיקה")).toBe(false);
  });

  it("ignore la casse et les champs vides", () => {
    expect(matchesQuery(["Final Exam", null, 2026], "final 2026")).toBe(true);
  });
});

describe("filterSessions", () => {
  const rows = [
    session({ id: 1 }),
    session({ id: 2, exam_title: "גיאומטריה", group_name: "קבוצה ב" }),
    session({ id: 3, catalog_name: "פיזיקה", exam_title: "מכניקה" }),
  ];

  it("filtre par texte", () => {
    expect(filterSessions(rows, { ...NO_FILTERS, query: "גיאו" }).map((s) => s.id)).toEqual([2]);
  });

  it("filtre par cours catalogue et combine avec le texte", () => {
    expect(filterSessions(rows, { query: "", catalogName: "פיזיקה" }).map((s) => s.id)).toEqual([3]);
    expect(filterSessions(rows, { query: "אלגברה", catalogName: "פיזיקה" })).toEqual([]);
  });

  it("sans filtre, renvoie tout", () => {
    expect(filterSessions(rows, NO_FILTERS)).toHaveLength(3);
  });
});

describe("autres helpers", () => {
  it("filtre les modèles d'examens", () => {
    const rows = [
      { title: "אלגברה", catalogName: "מתמטיקה" },
      { title: "מכניקה", catalogName: "פיזיקה" },
    ];
    expect(filterTemplates(rows, { query: "מכ", catalogName: "" })).toEqual([rows[1]]);
  });

  it("détecte des filtres actifs", () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
    expect(hasActiveFilters({ query: " x ", catalogName: "" })).toBe(true);
    expect(hasActiveFilters({ query: "", catalogName: "מתמטיקה" })).toBe(true);
  });

  it("déduplique et trie les noms de cours", () => {
    expect(catalogNames(["ב", "א", "ב", ""])).toEqual(["א", "ב"]);
  });
});
