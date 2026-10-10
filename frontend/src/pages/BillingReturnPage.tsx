import { useEffect, useState } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { fetchOrderStatus, notifyBillingChanged } from "../api/billing";
import { hebrewAlignRightSx } from "../styles/hebrewAlign";
import { he } from "../i18n/he";

function returnText(status: string): string {
  if (status === "paid") return he.aiCreditsReturnPaid;
  if (status === "pending") return he.aiCreditsReturnPending;
  return he.aiCreditsReturnFailed;
}

async function pollOrder(order: string, onStatus: (status: string) => void, stopped: () => boolean) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (stopped()) return;
    try {
      const row = await fetchOrderStatus(order);
      if (stopped()) return;
      onStatus(row.status);
      if (row.status === "paid") {
        notifyBillingChanged();
        return;
      }
      if (row.status !== "pending") return;
    } catch {
      if (!stopped()) onStatus("failed");
      return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1500));
  }
}

export default function BillingReturnPage() {
  const [params] = useSearchParams();
  const order = params.get("order") ?? "";
  const [status, setStatus] = useState(order ? "pending" : "failed");

  useEffect(() => {
    if (!order) return;
    let stopped = false;
    void pollOrder(order, setStatus, () => stopped);
    return () => {
      stopped = true;
    };
  }, [order]);

  return (
    <Box dir="rtl" sx={{ p: 3, maxWidth: 480, ...hebrewAlignRightSx }}>
      <Typography variant="h6" sx={{ mb: 2, ...hebrewAlignRightSx }}>
        {he.aiCreditsBuyTitle}
      </Typography>
      <Alert severity={status === "paid" ? "success" : status === "pending" ? "info" : "warning"} sx={{ mb: 2 }}>
        {returnText(status)}
      </Alert>
      <Button component={RouterLink} to="/" variant="contained">
        {he.aiCreditsBack}
      </Button>
    </Box>
  );
}
