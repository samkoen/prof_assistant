import { he } from "../i18n/he";
import { resetPasswordFormError } from "./resetPasswordForm";

export function withJoinToken(path: string, joinToken: string | null): string {
  if (!joinToken) return path;
  return `${path}?joinToken=${encodeURIComponent(joinToken)}`;
}

export function forgotPasswordPath(joinToken: string | null): string {
  return withJoinToken("/forgot-password", joinToken);
}

export function canSubmitForgotEmail(email: string): boolean {
  return email.trim().includes("@");
}

export function resetPasswordError(password: string, confirm: string): string {
  const kind = resetPasswordFormError(password, confirm);
  if (kind === "too_short") return he.passwordMinHint;
  if (kind === "mismatch") return he.passwordMismatch;
  return "";
}
