import { describe, expect, it } from "vitest";
import { guestEmailError, normalizeGuestEmail } from "../guestCheckout";

describe("guestEmailError", () => {
  it("refuse un champ vide et un email sans domaine", () => {
    expect(guestEmailError("  ")).toBe("required");
    expect(guestEmailError("buyer")).toBe("invalid");
    expect(guestEmailError("buyer@example")).toBe("invalid");
  });

  it("accepte l'email d'un compte, sans tenir compte de la casse", () => {
    expect(guestEmailError("  Buyer@Example.com ")).toBeNull();
    expect(normalizeGuestEmail("  Buyer@Example.com ")).toBe("buyer@example.com");
  });
});
