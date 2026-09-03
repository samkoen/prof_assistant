export const RESET_PASSWORD_MIN_LENGTH = 6;

export type ResetPasswordFormError = "too_short" | "mismatch" | null;

export function resetPasswordFormError(password: string, confirm: string): ResetPasswordFormError {
  if (password.length < RESET_PASSWORD_MIN_LENGTH) return "too_short";
  if (password !== confirm) return "mismatch";
  return null;
}
