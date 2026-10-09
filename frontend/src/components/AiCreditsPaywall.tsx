import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { fetchBillingBalance, notifyBillingChanged, onBillingChanged, startCheckout, walletFor } from "../api/billing";
import { hebrewAlignRightSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";
import { creditsRequiredFromError, type AiCreditPack, type CreditsRequired } from "../utils/aiCredits";

export function AiCreditBalance({ product }: { product: string }) {
  const [label, setLabel] = useState("");
  const reload = useCallback(() => {
    void fetchBillingBalance()
      .then((balance) => setLabel(balanceLabel(walletFor(balance, product))))
      .catch(() => setLabel(""));
  }, [product]);

  useEffect(() => {
    reload();
    return onBillingChanged(reload);
  }, [reload]);

  if (!label) return null;
  return (
    <Typography variant="caption" color="text.secondary" sx={hebrewAlignRightSx}>
      {label}
    </Typography>
  );
}

function balanceLabel(wallet: ReturnType<typeof walletFor>): string {
  if (!wallet) return "";
  return wallet.unlimited ? he.aiCreditsUnlimited : he.aiCreditsRemaining(wallet.total);
}

async function buyPack(code: string, setPaying: (v: boolean) => void, setPayError: (v: string) => void) {
  setPaying(true);
  setPayError("");
  try {
    const order = await startCheckout(code);
    window.location.assign(order.payment_url);
  } catch (error) {
    setPayError(error instanceof Error ? error.message : he.errorGeneric);
    setPaying(false);
  }
}

function PackButtons({
  packs,
  paying,
  onBuy,
  onClose,
}: {
  packs: AiCreditPack[];
  paying: boolean;
  onBuy: (code: string) => void;
  onClose: () => void;
}) {
  return (
    <DialogActions sx={{ flexWrap: "wrap", gap: 1, px: 3, pb: 2 }}>
      {packs.map((pack) => (
        <Button key={pack.code} variant="contained" disabled={paying} onClick={() => onBuy(pack.code)}>
          <span dir="ltr">{pack.label}</span>
        </Button>
      ))}
      <Button onClick={onClose} disabled={paying}>
        {he.cancel}
      </Button>
    </DialogActions>
  );
}

function AiCreditsDialog({ offer, onClose }: { offer: CreditsRequired | null; onClose: () => void }) {
  const [payError, setPayError] = useState("");
  const [paying, setPaying] = useState(false);
  return (
    <Dialog open={offer !== null} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle sx={hebrewAlignRightSx}>{he.aiCreditsBuyTitle}</DialogTitle>
      <DialogContent sx={hebrewAlignRightSx}>
        <Typography variant="body2" sx={{ mb: 2, ...hebrewAlignRightSx }}>
          {offer?.message || he.aiCreditsEmpty}
        </Typography>
        {payError && <Alert severity="error">{payError}</Alert>}
      </DialogContent>
      <PackButtons
        packs={offer?.packs ?? []}
        paying={paying}
        onClose={onClose}
        onBuy={(code) => void buyPack(code, setPaying, setPayError)}
      />
    </Dialog>
  );
}

export function useAiCreditsPaywall() {
  const [offer, setOffer] = useState<CreditsRequired | null>(null);
  const openFromError = useCallback((error: unknown) => {
    const required = creditsRequiredFromError(error);
    if (!required) return false;
    setOffer(required);
    notifyBillingChanged();
    return true;
  }, []);
  return {
    openFromError,
    dialog: <AiCreditsDialog offer={offer} onClose={() => setOffer(null)} />,
  };
}
