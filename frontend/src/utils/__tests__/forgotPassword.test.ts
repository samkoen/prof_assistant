import { describe, expect, it } from "vitest";
import { he } from "../../i18n/he";
import {
  canSubmitForgotEmail,
  forgotPasswordPath,
  resetPasswordError,
  withJoinToken,
} from "../forgotPassword";

describe("forgotPassword", () => {
  it("garde le jeton d'inscription dans le lien", () => {
    expect(forgotPasswordPath(null)).toBe("/forgot-password");
    expect(withJoinToken("/login", "abc")).toBe("/login?joinToken=abc");
  });

  it("exige une adresse plausible", () => {
    expect(canSubmitForgotEmail("")).toBe(false);
    expect(canSubmitForgotEmail("ada@school.test")).toBe(true);
  });

  it("refuse un mot de passe trop court ou différent", () => {
    expect(resetPasswordError("12345", "12345")).toBe(he.passwordMinHint);
    expect(resetPasswordError("123456", "123457")).toBe(he.passwordMismatch);
    expect(resetPasswordError("123456", "123456")).toBe("");
  });
});
