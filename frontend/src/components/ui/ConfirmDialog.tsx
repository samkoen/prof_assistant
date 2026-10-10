import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { he } from "../../i18n/he";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  /** Précision affichée en gras sous le message (nom de l'élément concerné). */
  detail?: string;
  confirmLabel: string;
  color?: "primary" | "error" | "warning" | "success";
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** Confirmation standard d'une action destructive ou irréversible. */
export default function ConfirmDialog(props: ConfirmDialogProps) {
  const { open, title, message, detail, confirmLabel, color = "primary", busy = false, onClose, onConfirm } = props;
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
        {detail && (
          <Typography fontWeight={700} sx={{ mt: 1.5 }}>
            {detail}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {he.cancel}
        </Button>
        <Button variant="contained" color={color} onClick={onConfirm} disabled={busy}>
          {busy ? he.loading : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
