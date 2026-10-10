import { useEffect, useRef } from "react";
import { notifyBillingChanged } from "../api/billing";
import { shouldRefreshBalance } from "../utils/generationBalance";

/** Rafraîchit le solde de crédits dès qu'une génération IA se termine (réussie ou non). */
export function useRefreshBalanceAfterGeneration(generating: boolean): void {
  const wasGenerating = useRef(false);
  useEffect(() => {
    if (shouldRefreshBalance(wasGenerating.current, generating)) notifyBillingChanged();
    wasGenerating.current = generating;
  }, [generating]);
}
