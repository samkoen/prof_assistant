import { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { he } from "../../i18n/he";
import type { AdminUser } from "../../types/adminUser";
import { parseAdminCredits } from "../../utils/adminUserCredits";

type SetCreditsDialogProps = {
  user: AdminUser | null;
  saving: boolean;
  onClose: () => void;
  onSave: (credits: number) => void;
};

function CreditsField({ raw, invalid, onChange }: { raw: string; invalid: boolean; onChange: (v: string) => void }) {
  return (
    <TextField
      label={he.adminUserCredits}
      value={raw}
      onChange={(e) => onChange(e.target.value)}
      error={invalid}
      helperText={invalid ? he.adminSetCreditsInvalid : undefined}
      slotProps={{ htmlInput: { dir: "ltr", inputMode: "numeric", maxLength: 6 } }}
      fullWidth
    />
  );
}

/** Dialogue admin : remplacer le solde de crédits d'un utilisateur. */
export default function SetCreditsDialog({ user, saving, onClose, onSave }: SetCreditsDialogProps) {
  const [raw, setRaw] = useState("");
  useEffect(() => {
    setRaw(user && !user.ai_credits.unlimited ? String(user.ai_credits.credits ?? 0) : "");
  }, [user]);
  const parsed = parseAdminCredits(raw);
  const invalid = parsed === null;
  return (
    <Dialog open={Boolean(user)} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle>{he.adminSetCreditsTitle}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        {user && (
          <Typography variant="body2" color="text.secondary">
            {user.full_name} · {user.email}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">{he.adminSetCreditsHint}</Typography>
        <CreditsField raw={raw} invalid={invalid} onChange={setRaw} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>{he.cancel}</Button>
        <Button variant="contained" disabled={saving || invalid} onClick={() => parsed !== null && onSave(parsed)}>
          {saving ? he.loading : he.adminSetCreditsSave}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
