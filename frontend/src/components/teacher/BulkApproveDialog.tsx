import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { he } from "../../i18n/he";
import type { EnrollmentGroup } from "../../utils/enrollmentGroups";

type BulkApproveDialogProps = {
  group: EnrollmentGroup | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function BulkApproveDialog({ group, busy, onClose, onConfirm }: BulkApproveDialogProps) {
  return (
    <Dialog open={Boolean(group)} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle>{he.enrollmentsApproveAllTitle}</DialogTitle>
      <DialogContent>
        {group && <Typography>{he.enrollmentsApproveAllConfirm(group.rows.length, group.label)}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {he.cancel}
        </Button>
        <Button variant="contained" color="success" onClick={onConfirm} disabled={busy}>
          {busy ? he.loading : he.enrollmentsApproveAll}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
