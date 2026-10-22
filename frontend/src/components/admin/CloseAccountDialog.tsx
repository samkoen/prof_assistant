import { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { api, ApiError } from "../../api/client";
import { he } from "../../i18n/he";
import type { AdminUser } from "../../types/adminUser";

type RefundableOrder = { id: number; credits: number; price_ils: number; paid_at: string | null };

type CloseAccountDialogProps = {
  user: AdminUser | null;
  onClose: () => void;
  onDone: (message: string) => void;
  onError: (message: string) => void;
};

function packLabel(order: RefundableOrder): string {
  const when = order.paid_at ? new Date(order.paid_at).toLocaleDateString("he-IL") : "";
  return `${order.credits} ${he.aiCreditsUnit} — ${order.price_ils} ${he.shekelSign}${when ? ` · ${when}` : ""}`;
}

async function loadOrders(userId: number): Promise<RefundableOrder[]> {
  return api<RefundableOrder[]>(`/api/admin/users/${userId}/refundable-orders`);
}

/** Clôture admin : remboursement d'une חבילה intacte, puis blocage et annulation du solde. */
export default function CloseAccountDialog({ user, onClose, onDone, onError }: CloseAccountDialogProps) {
  const [orders, setOrders] = useState<RefundableOrder[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    void loadOrders(user.id).then(setOrders).catch(() => setOrders([]));
  }, [user]);

  const run = async (path: string, done: string) => {
    if (!user) return;
    setBusy(true);
    try {
      await api(path, { method: "POST" });
      onDone(done);
      onClose();
    } catch (error) {
      onError(error instanceof ApiError ? error.message : he.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={user !== null} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle>{he.closeAccount}</DialogTitle>
      <DialogContent>
        <Typography>{he.closeAccountConfirm}</Typography>
        <Typography fontWeight={700} sx={{ mt: 1 }}>{user?.full_name}</Typography>
        <Typography sx={{ mt: 2 }}>{orders.length ? he.refundPack : he.noRefundablePack}</Typography>
        {orders.map((order) => (
          <Button key={order.id} sx={{ mt: 1 }} disabled={busy} onClick={() => void run(`/api/admin/users/${user?.id}/orders/${order.id}/refund`, he.refundPackDone)}>
            {packLabel(order)}
          </Button>
        ))}
        {orders.length > 0 && (
          <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>{he.closeAccountRefundFirst}</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>{he.cancel}</Button>
        <Button color="error" variant="contained" disabled={busy || orders.length > 0 || user?.role === "admin"} onClick={() => void run(`/api/admin/users/${user?.id}/close`, he.closeAccountDone)}>
          {he.closeAccount}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
