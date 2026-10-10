import { ApiError } from "../api/client";

export const STUDENT_AI_PRODUCT = "student_ai";
export const TEACHER_AI_PRODUCT = "teacher_generation";

export interface AiCreditPack {
  code: string;
  product: string;
  credits: number;
  price_ils: number;
  label: string;
}

export interface CreditsRequired {
  product: string;
  message: string;
  packs: AiCreditPack[];
}

export interface CreditWalletView {
  product: string;
  total: number;
  unlimited: boolean;
}

export function profileCreditWallets<T extends CreditWalletView>(role: string, wallets: T[]): T[] {
  if (role === "admin") return wallets.slice(0, 1);
  const product = role === "teacher" ? TEACHER_AI_PRODUCT : STUDENT_AI_PRODUCT;
  const wallet = wallets.find((row) => row.product === product);
  return wallet ? [wallet] : [];
}

export function creditsRequiredFromError(error: unknown): CreditsRequired | null {
  if (!(error instanceof ApiError) || error.status !== 402) return null;
  const body = error.data;
  if (!body || typeof body !== "object") return null;
  const detail = (body as { detail?: unknown }).detail;
  if (!detail || typeof detail !== "object") return null;
  const payload = detail as { code?: string; product?: string; message?: string; packs?: AiCreditPack[] };
  if (payload.code !== "ai_credits_required") return null;
  return {
    product: payload.product ?? "",
    message: payload.message || error.message,
    packs: payload.packs ?? [],
  };
}
