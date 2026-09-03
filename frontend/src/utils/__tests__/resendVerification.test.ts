import { describe, expect, it } from "vitest";
import { he } from "../../i18n/he";
import { canSubmitResendEmail, shouldOfferResendVerification } from "../resendVerification";

describe("resendVerification", () => {
  it("propose un renvoi si le compte existe déjà ou n'est pas vérifié", () => {
    expect(shouldOfferResendVerification(he.loginEmailNotVerified)).toBe(true);
    expect(shouldOfferResendVerification(he.emailAlreadyExists)).toBe(true);
    expect(shouldOfferResendVerification(he.errorGeneric)).toBe(false);
  });

  it("exige une adresse plausible", () => {
    expect(canSubmitResendEmail("")).toBe(false);
    expect(canSubmitResendEmail("ada@school.test")).toBe(true);
  });
});
