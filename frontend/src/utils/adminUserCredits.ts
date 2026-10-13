import { he } from "../i18n/he";
import type { AdminUserCredits } from "../types/adminUser";

export const MAX_ADMIN_CREDITS = 10_000;

/** Entier 0…10000, sinon null (saisie invalide). */
export function parseAdminCredits(raw: string): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const value = Number(raw);
  if (value < 0 || value > MAX_ADMIN_CREDITS) return null;
  return value;
}

export function adminCreditsLabel(ai: AdminUserCredits): string {
  if (ai.unlimited) return he.adminUserCreditsUnlimited;
  return String(ai.credits ?? 0);
}

export function canEditAdminCredits(ai: AdminUserCredits): boolean {
  return !ai.unlimited;
}
