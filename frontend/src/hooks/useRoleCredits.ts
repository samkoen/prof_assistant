import { useEffect, useState } from "react";
import { fetchBillingBalance, onBillingChanged, type WalletBalance } from "../api/billing";
import type { UserRole } from "../api/client";
import { profileCreditWallets } from "../utils/aiCredits";

type RoleCredits = {
  wallet: WalletBalance | null;
  loading: boolean;
};

/** Solde de crédits AI du rôle courant, rafraîchi après achat ou consommation. */
export function useRoleCredits(role: UserRole | undefined): RoleCredits {
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(Boolean(role));

  useEffect(() => {
    if (!role) return;
    let alive = true;
    const load = () =>
      fetchBillingBalance()
        .then((data) => alive && setWallet(profileCreditWallets(role, data.wallets)[0] ?? null))
        .catch(() => alive && setWallet(null))
        .finally(() => alive && setLoading(false));
    load();
    const stop = onBillingChanged(load);
    return () => {
      alive = false;
      stop();
    };
  }, [role]);

  return { wallet, loading };
}
