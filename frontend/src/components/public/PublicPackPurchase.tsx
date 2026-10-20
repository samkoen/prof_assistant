import { useState } from "react";
import { Alert, Box, Stack, TextField, Typography } from "@mui/material";
import { ApiError } from "../../api/client";
import { startGuestCheckout } from "../../api/billing";
import PackLabel from "../billing/PackLabel";
import LoadingButton from "../ui/LoadingButton";
import { he } from "../../i18n/he";
import { brand, softCardShadow } from "../../theme/brand";
import { STUDENT_AI_PRODUCT, TEACHER_AI_PRODUCT, type AiCreditPack } from "../../utils/aiCredits";
import { guestEmailError, normalizeGuestEmail } from "../../utils/guestCheckout";
import { packsForProduct } from "../../utils/publicCatalog";

const emailErrorText = {
  required: he.publicHome.guestEmailRequired,
  invalid: he.publicHome.guestEmailInvalid,
} as const;

export default function PublicPackPurchase({ packs }: { packs: AiCreditPack[] }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [paying, setPaying] = useState("");

  const buy = (code: string) => {
    const problem = guestEmailError(email);
    if (problem) {
      setError(emailErrorText[problem]);
      return;
    }
    void sendPurchase(normalizeGuestEmail(email), code, setPaying, setError);
  };

  return (
    <Box component="section">
      <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>{he.publicHome.pricesTitle}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{he.publicHome.pricesLead}</Typography>
      <TextField
        label={he.publicHome.guestEmailLabel}
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        fullWidth
        sx={{ mb: 2, maxWidth: 480, "& input": { direction: "ltr", textAlign: "left" } }}
      />
      {error && <Alert severity="error" sx={{ mb: 2, maxWidth: 480 }}>{error}</Alert>}
      <Stack sx={{ gap: 2 }}>
        <PackGroup title={he.publicHome.studentPacksTitle} packs={packsForProduct(packs, STUDENT_AI_PRODUCT)} paying={paying} onBuy={buy} />
        <PackGroup title={he.publicHome.teacherPacksTitle} packs={packsForProduct(packs, TEACHER_AI_PRODUCT)} paying={paying} onBuy={buy} />
      </Stack>
    </Box>
  );
}

async function sendPurchase(
  email: string,
  code: string,
  setPaying: (code: string) => void,
  setError: (message: string) => void,
) {
  setPaying(code);
  setError("");
  try {
    const order = await startGuestCheckout(email, code);
    window.location.assign(order.payment_url);
  } catch (error) {
    setError(error instanceof ApiError ? error.message : he.errorGeneric);
    setPaying("");
  }
}

function PackGroup({
  title,
  packs,
  paying,
  onBuy,
}: {
  title: string;
  packs: AiCreditPack[];
  paying: string;
  onBuy: (code: string) => void;
}) {
  return (
    <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: brand.white, boxShadow: softCardShadow }}>
      <Typography fontWeight={800} sx={{ mb: 1 }}>{title}</Typography>
      <Stack component="ul" sx={{ m: 0, p: 0, listStyle: "none", gap: 1 }}>
        {packs.map((pack) => (
          <Stack key={pack.code} component="li" direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Typography><PackLabel pack={pack} /></Typography>
            <LoadingButton variant="contained" size="small" loading={paying === pack.code} disabled={Boolean(paying)} onClick={() => onBuy(pack.code)}>
              {he.publicHome.guestBuy}
            </LoadingButton>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
