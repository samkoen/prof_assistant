import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import type { ExamSession } from "../../api/client";
import { he } from "../../i18n/he";
import { SESSION_ACTION_COPY, type SessionActionKind } from "./sessionActionCopy";

type ConfirmSessionDialogProps = {
  kind: SessionActionKind | null;
  session: ExamSession | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** Confirmation unique pour clôturer, annuler la mise en ligne ou rouvrir un examen. */
export default function ConfirmSessionDialog({ kind, session, busy, onClose, onConfirm }: ConfirmSessionDialogProps) {
  const copy = kind ? SESSION_ACTION_COPY[kind] : null;
  return (
    <Dialog open={Boolean(copy && session)} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle>{copy?.title}</DialogTitle>
      <DialogContent>
        <Typography>{copy?.message}</Typography>
        {session && (
          <Typography fontWeight={700} sx={{ mt: 1.5 }}>
            {session.exam_title}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{he.cancel}</Button>
        <Button variant="contained" color={copy?.color} onClick={onConfirm} disabled={busy}>
          {busy ? he.loading : copy?.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
