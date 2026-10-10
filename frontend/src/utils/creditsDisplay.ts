import type { WalletBalance } from "../api/billing";
import { he } from "../i18n/he";

/** Valeur affichée pour un solde de crédits AI : « — » inconnu, « ללא הגבלה » illimité, sinon le total. */
export function creditsValue(wallet: WalletBalance | null): string | number {
  if (!wallet) return "—";
  return wallet.unlimited ? he.statUnlimited : wallet.total;
}
