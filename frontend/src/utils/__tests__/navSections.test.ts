import { describe, expect, it } from "vitest";
import { groupNavItems, isOutsideMobileNav, MOBILE_NAV_MAX, mobileNavItems } from "../navSections";

const items = [
  { path: "/teacher", mobileLabel: "בית" },
  { path: "/teacher/courses", mobileLabel: "קורסים" },
  { path: "/teacher/enrollments", section: "manage" as const },
  { path: "/contact", section: "account" as const },
  { path: "/teacher/exams", mobileLabel: "מטלות" },
];

describe("groupNavItems", () => {
  it("place les entrées sans section dans main et garde l'ordre des sections", () => {
    const groups = groupNavItems(items);
    expect(groups.map((g) => g.section)).toEqual(["main", "manage", "account"]);
    expect(groups[0].items.map((i) => i.path)).toEqual(["/teacher", "/teacher/courses", "/teacher/exams"]);
  });

  it("omet les sections vides", () => {
    expect(groupNavItems([{ path: "/a" }]).map((g) => g.section)).toEqual(["main"]);
  });
});

describe("mobileNavItems", () => {
  it("ne garde que les entrées avec un libellé court", () => {
    expect(mobileNavItems(items).map((i) => i.path)).toEqual(["/teacher", "/teacher/courses", "/teacher/exams"]);
  });

  it("limite le nombre d'onglets", () => {
    const many = Array.from({ length: 7 }, (_, i) => ({ path: `/p${i}`, mobileLabel: `p${i}` }));
    expect(mobileNavItems(many)).toHaveLength(MOBILE_NAV_MAX);
  });
});

describe("isOutsideMobileNav", () => {
  it("est vrai quand aucun onglet n'est actif", () => {
    expect(isOutsideMobileNav([false, false])).toBe(true);
    expect(isOutsideMobileNav([false, true])).toBe(false);
  });
});
