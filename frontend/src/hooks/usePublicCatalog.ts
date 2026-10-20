import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { AiCreditPack } from "../utils/aiCredits";
import { DEFAULT_PUBLIC_PACKS, parsePublicCatalog } from "../utils/publicCatalog";

/** Prix publics : le catalogue du serveur, sinon les forfaits par défaut. */
export function usePublicCatalog(): AiCreditPack[] {
  const [packs, setPacks] = useState(DEFAULT_PUBLIC_PACKS);

  useEffect(() => {
    let alive = true;
    api<{ packs: AiCreditPack[] }>("/api/billing/catalog")
      .then((data) => {
        const parsed = parsePublicCatalog(data);
        if (alive && parsed) setPacks(parsed);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return packs;
}
