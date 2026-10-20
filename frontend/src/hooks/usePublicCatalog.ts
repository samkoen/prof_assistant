import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { AiCreditPack } from "../utils/aiCredits";
import { DEFAULT_CALLS_PER_CREDIT } from "../utils/creditCost";
import { DEFAULT_PUBLIC_PACKS, parsePublicCatalog } from "../utils/publicCatalog";

function callsFromCatalog(data: unknown): number {
  const raw = (data as { calls_per_teacher_credit?: unknown })?.calls_per_teacher_credit;
  return typeof raw === "number" && raw > 0 ? raw : DEFAULT_CALLS_PER_CREDIT;
}

/** Prix publics : le catalogue du serveur, sinon les forfaits par défaut. */
export function usePublicCatalog(): { packs: AiCreditPack[]; callsPerCredit: number } {
  const [packs, setPacks] = useState(DEFAULT_PUBLIC_PACKS);
  const [callsPerCredit, setCallsPerCredit] = useState(DEFAULT_CALLS_PER_CREDIT);

  useEffect(() => {
    let alive = true;
    api<{ packs: AiCreditPack[]; calls_per_teacher_credit?: number }>("/api/billing/catalog")
      .then((data) => {
        const parsed = parsePublicCatalog(data);
        if (!alive) return;
        if (parsed) setPacks(parsed);
        setCallsPerCredit(callsFromCatalog(data));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return { packs, callsPerCredit };
}
