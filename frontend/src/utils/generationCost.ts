import type { WalletBalance } from "../api/billing";
import { he } from "../i18n/he";
import type { GeminiGenerationPreview } from "../types/geminiGenerationPreview";

export type GenerationCostView = {
  title: string;
  /** « קרדיט אחד », « 2 קרדיטים » ou « ללא עלות ». */
  cost: string;
  includes: string | null;
  worstCase: string | null;
  balance: string | null;
  /** Solde connu et inférieur au coût estimé. */
  insufficient: boolean;
};

type CostInput = Pick<GeminiGenerationPreview, "estimated_credits" | "max_credits" | "calls_per_credit">;
type WalletInput = Pick<WalletBalance, "total" | "unlimited"> | null;

export function creditsText(count: number): string {
  if (count <= 0) return he.geminiCostFree;
  return count === 1 ? he.geminiCostOne : he.geminiCostMany(count);
}

function isInsufficient(estimated: number, wallet: WalletInput): boolean {
  return Boolean(wallet && !wallet.unlimited && estimated > 0 && wallet.total < estimated);
}

/** Texte de l'estimation affichée juste avant la confirmation de la génération. */
export function generationCostView(preview: CostInput, wallet: WalletInput): GenerationCostView {
  const estimated = preview.estimated_credits ?? 0;
  const max = preview.max_credits ?? estimated;
  const paid = estimated > 0;
  return {
    title: he.geminiCostTitle,
    cost: creditsText(estimated),
    includes: paid ? he.geminiCostIncludes(preview.calls_per_credit) : null,
    worstCase: paid && max > estimated ? he.geminiCostWorstCase(max) : null,
    balance: paid && wallet && !wallet.unlimited ? he.geminiCostBalance(wallet.total) : null,
    insufficient: isInsufficient(estimated, wallet),
  };
}
