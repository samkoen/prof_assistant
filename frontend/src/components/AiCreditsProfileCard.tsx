import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import {
  fetchBillingBalance,
  fetchBillingPacks,
  onBillingChanged,
  startCheckout,
  type WalletBalance,
} from "../api/billing";
import { he } from "../i18n/he";
import { hebrewAlignRightSx } from "../styles/hebrewAlign";
import { profileCreditWallets, type AiCreditPack } from "../utils/aiCredits";

function usageLabel(product: string): string {
  if (product === "teacher_generation") return he.aiCreditsTeacherUse;
  if (product === "student_ai") return he.aiCreditsStudentUse;
  return "";
}

function WalletLines({ wallets }: { wallets: WalletBalance[] }) {
  return (
    <>
      {wallets.map((wallet) => (
        <Box key={wallet.product} sx={{ mt: 1 }}>
          {!wallet.unlimited && usageLabel(wallet.product) && (
            <Typography variant="body2" color="text.secondary" sx={hebrewAlignRightSx}>
              {usageLabel(wallet.product)}
            </Typography>
          )}
          <Typography variant="h6" sx={hebrewAlignRightSx}>
            {wallet.unlimited ? he.aiCreditsUnlimited : he.aiCreditsRemaining(wallet.total)}
          </Typography>
        </Box>
      ))}
    </>
  );
}

async function loadProfileCredits(role: string) {
  const balance = await fetchBillingBalance();
  const wallets = profileCreditWallets(role, balance.wallets);
  const packs = wallets.some((row) => row.unlimited) ? [] : await fetchBillingPacks();
  return { wallets, packs };
}

function useProfileCredits(role: string) {
  const [wallets, setWallets] = useState<WalletBalance[] | null>(null);
  const [packs, setPacks] = useState<AiCreditPack[]>([]);
  const [error, setError] = useState("");
  const reload = useCallback(() => {
    setError("");
    void loadProfileCredits(role)
      .then((data) => {
        setWallets(data.wallets);
        setPacks(data.packs);
      })
      .catch(() => setError(he.aiCreditsLoadError));
  }, [role]);
  useEffect(() => {
    reload();
    return onBillingChanged(reload);
  }, [reload]);
  return { wallets, packs, error };
}

function PackBuyRow({
  packs,
  paying,
  onBuy,
}: {
  packs: AiCreditPack[];
  paying: boolean;
  onBuy: (code: string) => void;
}) {
  if (packs.length === 0) return null;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
      {packs.map((pack) => (
        <Button key={pack.code} variant="outlined" disabled={paying} onClick={() => onBuy(pack.code)}>
          <span dir="ltr">{pack.label}</span>
        </Button>
      ))}
    </Box>
  );
}

function buyPack(code: string, setPaying: (v: boolean) => void, setPayError: (v: string) => void) {
  setPaying(true);
  setPayError("");
  void startCheckout(code)
    .then((order) => window.location.assign(order.payment_url))
    .catch((error: unknown) => {
      setPayError(error instanceof Error ? error.message : he.errorGeneric);
      setPaying(false);
    });
}

export default function AiCreditsProfileCard({ role }: { role: string }) {
  const { wallets, packs, error } = useProfileCredits(role);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  return (
    <Card variant="outlined" dir="rtl" sx={{ mb: 3, maxWidth: 520 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} sx={hebrewAlignRightSx}>
          {he.aiCreditsProfileTitle}
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        {payError && <Alert severity="error" sx={{ mt: 1 }}>{payError}</Alert>}
        {wallets === null && !error && <CircularProgress size={22} sx={{ mt: 1 }} />}
        {wallets && <WalletLines wallets={wallets} />}
        <PackBuyRow packs={packs} paying={paying} onBuy={(code) => buyPack(code, setPaying, setPayError)} />
      </CardContent>
    </Card>
  );
}
