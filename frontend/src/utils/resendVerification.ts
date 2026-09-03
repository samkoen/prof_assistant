import { he } from "../i18n/he";

export function shouldOfferResendVerification(message: string): boolean {
  return message === he.loginEmailNotVerified || message === he.emailAlreadyExists;
}

export function canSubmitResendEmail(email: string): boolean {
  return email.trim().includes("@");
}
