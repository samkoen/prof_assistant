import { describe, expect, it } from "vitest";
import { he } from "../../i18n/he";
import {
  MAX_ADMIN_CREDITS,
  adminCreditsLabel,
  canEditAdminCredits,
  parseAdminCredits,
} from "../adminUserCredits";

describe("parseAdminCredits", () => {
  it("accepte un entier dans la plage", () => {
    expect(parseAdminCredits("0")).toBe(0);
    expect(parseAdminCredits("42")).toBe(42);
    expect(parseAdminCredits(String(MAX_ADMIN_CREDITS))).toBe(MAX_ADMIN_CREDITS);
  });

  it("refuse le vide, le négatif et le trop grand", () => {
    expect(parseAdminCredits("")).toBeNull();
    expect(parseAdminCredits("-1")).toBeNull();
    expect(parseAdminCredits("10.5")).toBeNull();
    expect(parseAdminCredits(String(MAX_ADMIN_CREDITS + 1))).toBeNull();
  });
});

describe("adminCreditsLabel", () => {
  it("affiche illimité pour un admin", () => {
    expect(adminCreditsLabel({ credits: null, unlimited: true, product: null })).toBe(
      he.adminUserCreditsUnlimited,
    );
  });

  it("affiche le nombre pour un élève", () => {
    expect(adminCreditsLabel({ credits: 7, unlimited: false, product: "student_ai" })).toBe("7");
  });
});

describe("canEditAdminCredits", () => {
  it("interdit l'édition du solde illimité", () => {
    expect(canEditAdminCredits({ credits: null, unlimited: true, product: null })).toBe(false);
    expect(canEditAdminCredits({ credits: 3, unlimited: false, product: "student_ai" })).toBe(true);
  });
});
