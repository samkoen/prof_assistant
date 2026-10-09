import { describe, expect, it } from "vitest";
import { ApiError } from "../../api/client";
import { creditsRequiredFromError, profileCreditWallets } from "../aiCredits";

describe("creditsRequiredFromError", () => {
  it("lit le 402 de crédits", () => {
    const error = new ApiError("נגמרו", 402, {
      detail: {
        code: "ai_credits_required",
        message: "נגמרו קרדיטי ה-AI",
        product: "student_ai",
        packs: [{ code: "student_20", product: "student_ai", credits: 20, price_ils: 19, label: "20" }],
      },
    });
    const parsed = creditsRequiredFromError(error);
    expect(parsed?.product).toBe("student_ai");
    expect(parsed?.packs).toHaveLength(1);
    expect(parsed?.packs[0].price_ils).toBe(19);
  });

  it("choisit le portefeuille du profil selon le rôle", () => {
    const wallets = [
      { product: "student_ai", total: 5, unlimited: false },
      { product: "teacher_generation", total: 3, unlimited: false },
    ];
    expect(profileCreditWallets("student", wallets).map((row) => row.product)).toEqual(["student_ai"]);
    expect(profileCreditWallets("teacher", wallets).map((row) => row.total)).toEqual([3]);
    expect(profileCreditWallets("admin", wallets)).toHaveLength(1);
    expect(profileCreditWallets("teacher", [])).toEqual([]);
  });

  it("ignore les autres erreurs", () => {
    expect(creditsRequiredFromError(new ApiError("non", 503))).toBeNull();
    expect(creditsRequiredFromError(new Error("x"))).toBeNull();
  });
});
