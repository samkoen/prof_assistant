import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import DisabledActionTooltip from "../DisabledActionTooltip";
import { he } from "../../i18n/he";
import type { CatalogEditForm } from "../../utils/catalogForm";

type EditCatalogDialogProps = {
  form: CatalogEditForm | null;
  missing: string | null;
  busy: boolean;
  onChange: (form: CatalogEditForm) => void;
  onClose: () => void;
  onSave: () => void;
};

/** Dialogue d'édition d'un cours catalogue : nom et description. */
export default function EditCatalogDialog({ form, missing, busy, onChange, onClose, onSave }: EditCatalogDialogProps) {
  return (
    <Dialog open={form !== null} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>{he.editCatalogCourse}</DialogTitle>
      {form && (
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
          <TextField required fullWidth label={he.subject} value={form.name} helperText={he.editOfferingCatalogHint} onChange={(e) => onChange({ ...form, name: e.target.value })} />
          <TextField fullWidth multiline rows={2} label={he.description} value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} />
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>{he.cancel}</Button>
        <DisabledActionTooltip disabled={Boolean(missing) || busy} disabledReason={missing ?? undefined}>
          <Button variant="contained" onClick={onSave}>{busy ? he.loading : he.save}</Button>
        </DisabledActionTooltip>
      </DialogActions>
    </Dialog>
  );
}
