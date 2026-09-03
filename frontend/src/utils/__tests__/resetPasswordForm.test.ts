import { describe, expect, it } from "vitest";
import { resetPasswordFormError } from "../resetPasswordForm";

describe("resetPasswordFormError", () => {
  it("refuse un mot de passe trop court", () => {
    expect(resetPasswordFormError("12345", "12345")).toBe("too_short");
  });

  it("refuse une confirmation différente", () => {
    expect(resetPasswordFormError("secret1", "secret2")).toBe("mismatch");
  });

  it("accepte un mot de passe valide confirmé", () => {
    expect(resetPasswordFormError("secret1", "secret1")).toBeNull();
  });
});
