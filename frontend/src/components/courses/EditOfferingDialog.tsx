import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from "@mui/material";
import DisabledActionTooltip from "../DisabledActionTooltip";
import { he } from "../../i18n/he";
import type { OfferingEditForm } from "../../utils/offeringForm";

type EditOfferingDialogProps = {
  form: OfferingEditForm | null;
  missing: string | null;
  busy: boolean;
  onChange: (form: OfferingEditForm) => void;
  onClose: () => void;
  onSave: () => void;
};

function PeriodFields({ form, onChange }: { form: OfferingEditForm; onChange: (form: OfferingEditForm) => void }) {
  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <TextField required fullWidth type="number" label={he.academicYear} value={form.academic_year} onChange={(e) => onChange({ ...form, academic_year: e.target.value })} />
      <TextField select fullWidth label={he.semester} value={form.semester} onChange={(e) => onChange({ ...form, semester: e.target.value })}>
        <MenuItem value="1">סמסטר א</MenuItem>
        <MenuItem value="2">סמסטר ב</MenuItem>
      </TextField>
    </Box>
  );
}

/** Dialogue d'édition : nom du cours, groupe, année, semestre et description. */
export default function EditOfferingDialog({ form, missing, busy, onChange, onClose, onSave }: EditOfferingDialogProps) {
  return (
    <Dialog open={form !== null} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>{he.editOffering}</DialogTitle>
      {form && (
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
          <TextField required fullWidth label={he.subject} value={form.catalog_name} helperText={he.editOfferingCatalogHint} onChange={(e) => onChange({ ...form, catalog_name: e.target.value })} />
          <TextField required fullWidth label={he.groupName} value={form.group_name} onChange={(e) => onChange({ ...form, group_name: e.target.value })} />
          <PeriodFields form={form} onChange={onChange} />
          <TextField multiline rows={2} label={he.description} value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} />
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
