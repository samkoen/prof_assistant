import { STUDENT_AI_PRODUCT, TEACHER_AI_PRODUCT, type AiCreditPack } from "./aiCredits";

const PRODUCTS = new Set([STUDENT_AI_PRODUCT, TEACHER_AI_PRODUCT]);

export const DEFAULT_PUBLIC_PACKS: AiCreditPack[] = [
  { code: "student_20", product: STUDENT_AI_PRODUCT, credits: 20, price_ils: 19, label: "" },
  { code: "student_60", product: STUDENT_AI_PRODUCT, credits: 60, price_ils: 45, label: "" },
  { code: "teacher_5", product: TEACHER_AI_PRODUCT, credits: 5, price_ils: 29, label: "" },
  { code: "teacher_15", product: TEACHER_AI_PRODUCT, credits: 15, price_ils: 69, label: "" },
];

export function packsForProduct(packs: AiCreditPack[], product: string): AiCreditPack[] {
  return packs.filter((pack) => pack.product === product);
}

function isPack(value: unknown): value is AiCreditPack {
  if (!value || typeof value !== "object") return false;
  const row = value as AiCreditPack;
  return (
    typeof row.code === "string" &&
    PRODUCTS.has(row.product) &&
    typeof row.credits === "number" &&
    row.credits > 0 &&
    typeof row.price_ils === "number" &&
    row.price_ils > 0
  );
}

export function parsePublicCatalog(data: unknown): AiCreditPack[] | null {
  if (!data || typeof data !== "object") return null;
  const packs = (data as { packs?: unknown }).packs;
  if (!Array.isArray(packs)) return null;
  const valid = packs.filter(isPack);
  return valid.length > 0 ? valid : null;
}
